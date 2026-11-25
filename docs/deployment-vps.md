# Despliegue de Learn2Code en Ubuntu

La aplicación usa `app.learn2code.win` para el frontend y la API bajo `/api/v1`. Caddy obtiene y renueva el certificado HTTPS. La API, PostgreSQL 17, Redis 8 y Nginx se comunican por la red privada de Compose. Resend envía desde el dominio verificado `learn2code.win`.

## 1. Crear el VPS y configurar el DNS

En Oracle Cloud, elegir una instancia Always Free `VM.Standard.A1.Flex` en la región principal, con Ubuntu 24.04 ARM64, hasta 2 OCPU y 12 GB de RAM si la cuota está disponible. En caso de incompatibilidad comprobada con ARM64, elegir Ubuntu 24.04 x86_64 en Azure for Students y verificar cuánto consumen la VM, el disco y la IP del crédito estudiantil. En ambos casos usar una clave SSH y una IP pública estable. Permitir TCP 22 desde la IP de administración y TCP 80/443 desde Internet en las reglas de nube y del host.

Crear el registro DNS `A` de `app.learn2code.win` hacia la IP del VPS. Agregar un `AAAA` solo si IPv6 está configurado y es accesible. Conservar los registros de Resend. Comprobar la resolución desde fuera del VPS antes de arrancar Caddy.

## 2. Instalar Docker y clonar el repositorio

Seguir la [instalación oficial de Docker Engine en Ubuntu](https://docs.docker.com/engine/install/ubuntu/) con el repositorio APT de Docker. Instalar también los requisitos del daemon rootless.

```bash
sudo apt install docker-ce-rootless-extras uidmap dbus-user-session git openssl
sudo systemctl enable --now docker
sudo docker compose version
git clone --branch deploy/vps --single-branch https://github.com/eddzen-c/Learn2Code.git
cd Learn2Code
```

Para un repositorio privado, usar una credencial de lectura o una deploy key. Registrar el commit desplegado con `git rev-parse HEAD`.

## 3. Configurar Docker para el ejecutor de JavaScript

Crear una cuenta dedicada sin permisos de administrador ni membresía en el grupo `docker`. El segundo daemon usa su propio socket y almacén de imágenes. El backend se conecta a ese socket con el UID de la cuenta. [Docker rootless](https://docs.docker.com/engine/security/rootless/)

```bash
sudo useradd --create-home --home-dir /var/lib/learn2code-runner --shell /bin/bash learn2code-runner
runner_uid=$(id -u learn2code-runner)
runner_gid=$(id -g learn2code-runner)
sudo loginctl enable-linger learn2code-runner
sudo systemctl start "user@${runner_uid}.service"

runner_user() {
  sudo -u learn2code-runner -H env \
    XDG_RUNTIME_DIR="/run/user/${runner_uid}" \
    DBUS_SESSION_BUS_ADDRESS="unix:path=/run/user/${runner_uid}/bus" "$@"
}

runner_user install -d -m 700 /var/lib/learn2code-runner/api
runner_user dockerd-rootless-setuptool.sh install --force
runner_user install -d /var/lib/learn2code-runner/.config/systemd/user/docker.service.d
runner_user tee /var/lib/learn2code-runner/.config/systemd/user/docker.service.d/socket.conf >/dev/null <<'EOF'
[Service]
ExecStart=
ExecStart=/usr/bin/dockerd-rootless.sh --host=unix:///var/lib/learn2code-runner/api/docker.sock
EOF
runner_user systemctl --user daemon-reload
runner_user systemctl --user enable docker.service
runner_user systemctl --user restart docker.service

runner_docker() {
  runner_user docker --host unix:///var/lib/learn2code-runner/api/docker.sock "$@"
}

runner_docker info --format '{{.CgroupDriver}} {{.CgroupVersion}} {{json .SecurityOptions}}'
sudo cat "/sys/fs/cgroup/user.slice/user-${runner_uid}.slice/user@${runner_uid}.service/cgroup.controllers"
```

Antes de habilitar usuarios, verificar `systemd`, cgroup v2, la opción `rootless` y la delegación de `cpu`, `memory` y `pids`. Si falta alguno de estos controladores, aplicar la [delegación documentada por Docker](https://docs.docker.com/engine/security/rootless/tips/#limiting-resources) y volver a verificar. Construir la imagen con el nombre que usa el servicio.

```bash
runner_docker build -t learn2code-code-runner:dev - < <(tar -C infra/code-runner -cf - .)
runner_docker image inspect --format '{{.Os}}/{{.Architecture}}' learn2code-code-runner:dev
```

## 4. Crear los archivos de entorno

Crear los archivos en el VPS con permisos de propietario. Generar secretos separados para PostgreSQL, JWT y los códigos de verificación. El comando siguiente está previsto para una instalación nueva sobre archivos que aún no existen.

```bash
umask 077
set -o noclobber
cat > .env <<EOF
APP_DOMAIN=app.learn2code.win
POSTGRES_DB=learn2code
POSTGRES_USER=learn2code_user
POSTGRES_PASSWORD=$(openssl rand -hex 32)
RUNNER_UID=${runner_uid}
RUNNER_GID=${runner_gid}
EOF
cat > backend/.env <<EOF
JWT_ACCESS_SECRET=$(openssl rand -hex 32)
EMAIL_VERIFICATION_CODE_SECRET=$(openssl rand -hex 32)
AUTH_EMAIL_PROVIDER=resend
AUTH_EMAIL_FROM="Learn2Code <notificaciones@learn2code.win>"
RESEND_API_KEY=
AI_PROVIDER=mock
EOF
set +o noclobber
```

Completar `RESEND_API_KEY` en `backend/.env` con una clave de envío del dominio. Para habilitar el proveedor real de IA, configurar `AI_PROVIDER=openai`, `OPENAI_API_KEY` y un `OPENAI_MODEL` disponible en la cuenta. El frontend ya se compila con `VITE_API_URL=/api/v1`.

## 5. Arrancar y verificar

```bash
compose() {
  sudo docker compose -f docker-compose.yml -f compose.production.yml "$@"
}
compose config --quiet
compose up -d --build --wait
compose ps
compose exec -T caddy caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile
curl -fsSI https://app.learn2code.win/
curl -fsS https://app.learn2code.win/healthz
curl -fsS https://app.learn2code.win/api/v1/health
compose exec -T backend node --input-type=module - <<'JS'
import assert from 'node:assert/strict';
import { runJavaScriptInDocker } from './src/modules/exercises/services/docker-code-runner.service.js';
const result = await runJavaScriptInDocker({ code: 'console.log(4 + 7)' });
assert.equal(result.status, 'completed');
assert.equal(result.stdout.trim(), '11');
console.log('Runner OK');
JS
```

Esperar HTTP 200 y estados `up` para API, base de datos y Redis. Si falla el arranque, consultar `compose logs --tail 100 backend frontend caddy`. Revisar que solo Caddy publique puertos en `compose ps`.

Completar desde el navegador el registro, recepción y validación del código de correo en una cuenta de prueba autorizada, inicio de sesión, recarga con sesión activa, apertura de una ruta del frontend y envío de un ejercicio de JavaScript. Revisar el evento de entrega de ese correo en Resend. Confirmar que el servicio y el ejecutor vuelven a responder tras un reinicio del VPS.

Antes de una actualización, hacer un respaldo de PostgreSQL y conservarlo fuera de la VM. Probar la restauración en una base aparte. Por ejemplo, generar el respaldo con `compose exec -T postgres pg_dump -U learn2code_user -Fc learn2code > learn2code.dump` desde un directorio privado. Si ya hay datos de producción, planificar su restauración o migración antes de ejecutar el cambio de DNS.
