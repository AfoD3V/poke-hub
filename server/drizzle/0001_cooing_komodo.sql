CREATE TABLE IF NOT EXISTS "user_chase_cards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"card_id" text NOT NULL,
	"card_snapshot" jsonb NOT NULL,
	"added_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_chase_cards_user_card_unique" UNIQUE("user_id","card_id")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_chase_cards" ADD CONSTRAINT "user_chase_cards_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
