import { eq } from "drizzle-orm";
import { db } from "../db/client";
import { users } from "../db/schema";
import { createPasswordHash } from "./auth-core";
import type { AuthUser } from "../../../shared/auth";

type UserRecord = {
  id: string;
  email: string;
  passwordHash: string;
  displayName: string | null;
};

const toAuthUser = (record: UserRecord): AuthUser => ({
  id: record.id,
  email: record.email,
  displayName: record.displayName
});

export const registerUser = async (
  email: string,
  password: string,
  displayName?: string
): Promise<AuthUser> => {
  const passwordHash = createPasswordHash(password);
  const [created] = await db
    .insert(users)
    .values({
      email,
      passwordHash,
      displayName: displayName ?? null
    })
    .returning({
      id: users.id,
      email: users.email,
      passwordHash: users.passwordHash,
      displayName: users.displayName
    });

  if (!created) {
    throw new Error("Failed to create user");
  }

  return toAuthUser(created);
};

export const findUserByEmail = async (email: string): Promise<UserRecord | null> => {
  const [record] = await db
    .select({
      id: users.id,
      email: users.email,
      passwordHash: users.passwordHash,
      displayName: users.displayName
    })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  return record ?? null;
};
