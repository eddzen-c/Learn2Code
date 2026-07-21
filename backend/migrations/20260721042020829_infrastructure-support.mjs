export const shorthands = undefined;

export async function up(pgm) {
    pgm.sql(`
    CREATE TABLE audit_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

        user_id UUID
            REFERENCES users(id)
            ON DELETE SET NULL,

        action      VARCHAR(80) NOT NULL,
        entity_type VARCHAR(50),
        entity_id   UUID,
        request_id  UUID,
        ip_address  INET,
        user_agent  TEXT,
        metadata    JSONB NOT NULL DEFAULT '{}'::jsonb,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE INDEX idx_audit_user_created
        ON audit_logs(user_id, created_at DESC);

    CREATE INDEX idx_audit_entity
        ON audit_logs(entity_type, entity_id);

    CREATE INDEX idx_audit_request
        ON audit_logs(request_id)
        WHERE request_id IS NOT NULL;

    CREATE TABLE notifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

        user_id UUID NOT NULL
            REFERENCES users(id)
            ON DELETE CASCADE,

        type       VARCHAR(40) NOT NULL,
        title      VARCHAR(150) NOT NULL,
        content    TEXT NOT NULL,
        action_url TEXT,
        is_read    BOOLEAN NOT NULL DEFAULT false,
        read_at    TIMESTAMPTZ,
        metadata   JSONB NOT NULL DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

        CONSTRAINT chk_notification_read CHECK (
            (
                is_read = false
                AND read_at IS NULL
            )
            OR (
                is_read = true
                AND read_at IS NOT NULL
            )
        )
    );

    CREATE INDEX idx_notifications_user_unread
        ON notifications(user_id, created_at DESC)
        WHERE is_read = false;

    CREATE TABLE support_tickets (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

        user_id UUID NOT NULL
            REFERENCES users(id)
            ON DELETE CASCADE,

        assigned_admin_id UUID
            REFERENCES users(id)
            ON DELETE SET NULL,

        subject     VARCHAR(150) NOT NULL,
        description TEXT NOT NULL,

        priority VARCHAR(10) NOT NULL DEFAULT 'normal'
            CHECK (
                priority IN (
                    'low',
                    'normal',
                    'high',
                    'urgent'
                )
            ),

        status VARCHAR(20) NOT NULL DEFAULT 'open'
            CHECK (
                status IN (
                    'open',
                    'in_progress',
                    'resolved',
                    'closed'
                )
            ),

        created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
        resolved_at TIMESTAMPTZ,

        CONSTRAINT chk_ticket_resolution CHECK (
            resolved_at IS NULL
            OR resolved_at >= created_at
        )
    );

    CREATE INDEX idx_tickets_status
        ON support_tickets(status, priority, created_at);

    CREATE INDEX idx_tickets_user
        ON support_tickets(user_id, created_at DESC);

    CREATE TRIGGER trg_support_tickets_updated_at
        BEFORE UPDATE ON support_tickets
        FOR EACH ROW
        EXECUTE FUNCTION set_updated_at();
  `);
}

export async function down(pgm) {
    pgm.sql(`
    DROP TABLE IF EXISTS support_tickets;
    DROP TABLE IF EXISTS notifications;
    DROP TABLE IF EXISTS audit_logs;
  `);
}