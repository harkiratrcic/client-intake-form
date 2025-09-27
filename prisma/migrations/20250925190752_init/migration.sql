-- CreateTable
CREATE TABLE "owners" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "business_name" TEXT,
    "rcic_number" TEXT,
    "contact_phone" TEXT,
    "contact_address" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "last_login_at" DATETIME,
    "is_active" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "form_templates" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "field_schema" JSONB NOT NULL,
    "ui_schema" JSONB,
    "version" INTEGER NOT NULL DEFAULT 1,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "form_instances" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "template_id" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "client_email" TEXT NOT NULL,
    "secure_token" TEXT NOT NULL,
    "personal_message" TEXT,
    "status" TEXT NOT NULL DEFAULT 'SENT',
    "expires_at" DATETIME NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "opened_at" DATETIME,
    "submitted_at" DATETIME,
    CONSTRAINT "form_instances_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "form_templates" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "form_instances_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "owners" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "form_responses" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "instance_id" TEXT NOT NULL,
    "draft_data" JSONB,
    "submitted_data" JSONB,
    "last_saved_at" DATETIME,
    "submitted_at" DATETIME,
    "submission_ip" TEXT,
    "submission_user_agent" TEXT,
    CONSTRAINT "form_responses_instance_id_fkey" FOREIGN KEY ("instance_id") REFERENCES "form_instances" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "actor_type" TEXT NOT NULL,
    "actor_id" TEXT,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "metadata" JSONB,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "owner_id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" DATETIME NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_activity_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ip_address" TEXT,
    "user_agent" TEXT,
    CONSTRAINT "sessions_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "owners" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "owners_email_key" ON "owners"("email");

-- CreateIndex
CREATE UNIQUE INDEX "form_templates_slug_key" ON "form_templates"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "form_instances_secure_token_key" ON "form_instances"("secure_token");

-- CreateIndex
CREATE INDEX "form_instances_secure_token_idx" ON "form_instances"("secure_token");

-- CreateIndex
CREATE INDEX "form_instances_status_expires_at_idx" ON "form_instances"("status", "expires_at");

-- CreateIndex
CREATE INDEX "form_instances_owner_id_created_at_idx" ON "form_instances"("owner_id", "created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "form_responses_instance_id_key" ON "form_responses"("instance_id");

-- CreateIndex
CREATE INDEX "form_responses_instance_id_idx" ON "form_responses"("instance_id");

-- CreateIndex
CREATE INDEX "audit_logs_entity_type_entity_id_idx" ON "audit_logs"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "sessions_token_hash_key" ON "sessions"("token_hash");

-- CreateIndex
CREATE INDEX "sessions_token_hash_idx" ON "sessions"("token_hash");

-- CreateIndex
CREATE INDEX "sessions_expires_at_idx" ON "sessions"("expires_at");
