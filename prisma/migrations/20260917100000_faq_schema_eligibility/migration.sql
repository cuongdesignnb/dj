-- FAQ rich-result eligibility is an explicit organiser confirmation.
ALTER TABLE "faq_items"
  ADD COLUMN IF NOT EXISTS "answers_confirmed" BOOLEAN NOT NULL DEFAULT false;
