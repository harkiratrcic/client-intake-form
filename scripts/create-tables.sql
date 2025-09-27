-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "public"."form_status" AS ENUM ('SENT', 'IN_PROGRESS', 'COMPLETED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "public"."actor_type" AS ENUM ('OWNER', 'CLIENT', 'SYSTEM');

-- CreateTable
CREATE TABLE "public"."owners" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "business_name" TEXT,
    "rcic_number" TEXT,
    "contact_phone" TEXT,
    "contact_address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "last_login_at" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "owners_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."clients" (
    "id" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "date_of_birth" TIMESTAMP(3),
    "nationality" TEXT,
    "passport_number" TEXT,
    "current_status" TEXT,
    "address" TEXT,
    "city" TEXT,
    "province" TEXT,
    "postal_code" TEXT,
    "country" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."form_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "field_schema" JSONB NOT NULL,
    "ui_schema" JSONB,
    "version" INTEGER NOT NULL DEFAULT 1,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "form_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."form_instances" (
    "id" TEXT NOT NULL,
    "template_id" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "client_email" TEXT NOT NULL,
    "secure_token" TEXT NOT NULL,
    "personal_message" TEXT,
    "status" "public"."form_status" NOT NULL DEFAULT 'SENT',
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "opened_at" TIMESTAMP(3),
    "submitted_at" TIMESTAMP(3),

    CONSTRAINT "form_instances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."form_responses" (
    "id" TEXT NOT NULL,
    "instance_id" TEXT NOT NULL,
    "draft_data" JSONB,
    "submitted_data" JSONB,
    "submission_id" TEXT,
    "last_saved_at" TIMESTAMP(3),
    "submitted_at" TIMESTAMP(3),
    "submission_ip" TEXT,
    "submission_user_agent" TEXT,

    CONSTRAINT "form_responses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."audit_logs" (
    "id" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "actor_type" "public"."actor_type" NOT NULL,
    "actor_id" TEXT,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."sessions" (
    "id" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_activity_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ip_address" TEXT,
    "user_agent" TEXT,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "owners_email_key" ON "public"."owners"("email");

-- CreateIndex
CREATE INDEX "clients_owner_id_created_at_idx" ON "public"."clients"("owner_id", "created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "clients_owner_id_email_key" ON "public"."clients"("owner_id", "email");

-- CreateIndex
CREATE UNIQUE INDEX "form_templates_slug_key" ON "public"."form_templates"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "form_instances_secure_token_key" ON "public"."form_instances"("secure_token");

-- CreateIndex
CREATE INDEX "form_instances_secure_token_idx" ON "public"."form_instances"("secure_token");

-- CreateIndex
CREATE INDEX "form_instances_status_expires_at_idx" ON "public"."form_instances"("status", "expires_at");

-- CreateIndex
CREATE INDEX "form_instances_owner_id_created_at_idx" ON "public"."form_instances"("owner_id", "created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "form_responses_instance_id_key" ON "public"."form_responses"("instance_id");

-- CreateIndex
CREATE INDEX "form_responses_instance_id_idx" ON "public"."form_responses"("instance_id");

-- CreateIndex
CREATE INDEX "form_responses_submission_id_idx" ON "public"."form_responses"("submission_id");

-- CreateIndex
CREATE INDEX "audit_logs_entity_type_entity_id_idx" ON "public"."audit_logs"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "public"."audit_logs"("created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "sessions_token_hash_key" ON "public"."sessions"("token_hash");

-- CreateIndex
CREATE INDEX "sessions_token_hash_idx" ON "public"."sessions"("token_hash");

-- CreateIndex
CREATE INDEX "sessions_expires_at_idx" ON "public"."sessions"("expires_at");

-- AddForeignKey
ALTER TABLE "public"."clients" ADD CONSTRAINT "clients_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "public"."owners"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."form_instances" ADD CONSTRAINT "form_instances_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "public"."form_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."form_instances" ADD CONSTRAINT "form_instances_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "public"."owners"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."form_responses" ADD CONSTRAINT "form_responses_instance_id_fkey" FOREIGN KEY ("instance_id") REFERENCES "public"."form_instances"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sessions" ADD CONSTRAINT "sessions_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "public"."owners"("id") ON DELETE CASCADE ON UPDATE CASCADE;

