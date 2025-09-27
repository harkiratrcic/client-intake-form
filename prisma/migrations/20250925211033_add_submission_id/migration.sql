-- AlterTable
ALTER TABLE "form_responses" ADD COLUMN "submission_id" TEXT;

-- CreateIndex
CREATE INDEX "form_responses_submission_id_idx" ON "form_responses"("submission_id");
