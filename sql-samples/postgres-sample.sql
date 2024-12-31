CREATE SCHEMA "core";

CREATE SCHEMA "tenant";

CREATE TABLE "core"."tenants" (
  "tenant_id" UUID PRIMARY KEY DEFAULT (uuid_generate_v4()),
  "tenant_name" VARCHAR(100) UNIQUE NOT NULL,
  "tenant_domain" VARCHAR(255) UNIQUE NOT NULL,
  "is_active" BOOLEAN DEFAULT true,
  "created_at" TIMESTAMP DEFAULT (CURRENT_TIMESTAMP),
  "updated_at" TIMESTAMP DEFAULT (CURRENT_TIMESTAMP)
);

CREATE TABLE "core"."system_users" (
  "system_user_id" UUID PRIMARY KEY DEFAULT (uuid_generate_v4()),
  "email" VARCHAR(255) UNIQUE NOT NULL,
  "password_hash" VARCHAR(255) NOT NULL,
  "is_active" BOOLEAN DEFAULT true,
  "created_at" TIMESTAMP DEFAULT (CURRENT_TIMESTAMP),
  "updated_at" TIMESTAMP DEFAULT (CURRENT_TIMESTAMP)
);

CREATE TABLE "core"."system_roles" (
  "system_role_id" UUID PRIMARY KEY DEFAULT (uuid_generate_v4()),
  "role_name" VARCHAR(50) UNIQUE NOT NULL,
  "description" TEXT,
  "created_at" TIMESTAMP DEFAULT (CURRENT_TIMESTAMP)
);

CREATE TABLE "core"."system_user_roles" (
  "system_user_id" UUID,
  "system_role_id" UUID,
  "created_at" TIMESTAMP DEFAULT (CURRENT_TIMESTAMP),
  PRIMARY KEY ("system_user_id", "system_role_id")
);

CREATE TABLE "tenant"."users" (
  "user_id" UUID PRIMARY KEY DEFAULT (uuid_generate_v4()),
  "tenant_id" UUID,
  "email" VARCHAR(255) NOT NULL,
  "password_hash" VARCHAR(255) NOT NULL,
  "is_active" BOOLEAN DEFAULT true,
  "created_at" TIMESTAMP DEFAULT (CURRENT_TIMESTAMP),
  "updated_at" TIMESTAMP DEFAULT (CURRENT_TIMESTAMP)
);

CREATE TABLE "tenant"."roles" (
  "role_id" UUID PRIMARY KEY DEFAULT (uuid_generate_v4()),
  "tenant_id" UUID,
  "role_name" VARCHAR(50) NOT NULL,
  "description" TEXT,
  "created_at" TIMESTAMP DEFAULT (CURRENT_TIMESTAMP)
);

CREATE TABLE "tenant"."permissions" (
  "permission_id" UUID PRIMARY KEY DEFAULT (uuid_generate_v4()),
  "tenant_id" UUID,
  "permission_name" VARCHAR(100) NOT NULL,
  "description" TEXT,
  "created_at" TIMESTAMP DEFAULT (CURRENT_TIMESTAMP)
);

CREATE TABLE "tenant"."role_permissions" (
  "role_id" UUID,
  "permission_id" UUID,
  "created_at" TIMESTAMP DEFAULT (CURRENT_TIMESTAMP),
  PRIMARY KEY ("role_id", "permission_id")
);

CREATE TABLE "tenant"."user_roles" (
  "user_id" UUID,
  "role_id" UUID,
  "created_at" TIMESTAMP DEFAULT (CURRENT_TIMESTAMP),
  PRIMARY KEY ("user_id", "role_id")
);

CREATE UNIQUE INDEX ON "tenant"."users" ("tenant_id", "email");

CREATE UNIQUE INDEX ON "tenant"."roles" ("tenant_id", "role_name");

CREATE UNIQUE INDEX ON "tenant"."permissions" ("tenant_id", "permission_name");

ALTER TABLE "core"."system_user_roles" ADD FOREIGN KEY ("system_user_id") REFERENCES "core"."system_users" ("system_user_id");

ALTER TABLE "core"."system_user_roles" ADD FOREIGN KEY ("system_role_id") REFERENCES "core"."system_roles" ("system_role_id");

ALTER TABLE "tenant"."users" ADD FOREIGN KEY ("tenant_id") REFERENCES "core"."tenants" ("tenant_id");

ALTER TABLE "tenant"."roles" ADD FOREIGN KEY ("tenant_id") REFERENCES "core"."tenants" ("tenant_id");

ALTER TABLE "tenant"."permissions" ADD FOREIGN KEY ("tenant_id") REFERENCES "core"."tenants" ("tenant_id");

ALTER TABLE "tenant"."role_permissions" ADD FOREIGN KEY ("role_id") REFERENCES "tenant"."roles" ("role_id");

ALTER TABLE "tenant"."role_permissions" ADD FOREIGN KEY ("permission_id") REFERENCES "tenant"."permissions" ("permission_id");

ALTER TABLE "tenant"."user_roles" ADD FOREIGN KEY ("user_id") REFERENCES "tenant"."users" ("user_id");

ALTER TABLE "tenant"."user_roles" ADD FOREIGN KEY ("role_id") REFERENCES "tenant"."roles" ("role_id");
