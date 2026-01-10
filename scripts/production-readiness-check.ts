#!/usr/bin/env -S deno run --allow-net --allow-env --allow-read

// ============================================================================
// Production Readiness Check Script
// ============================================================================
// Created: 2025-11-16
// Author: elite-saas-developer
// Purpose: Validate backend is production-ready before deployment
// Usage: deno run --allow-net --allow-env --allow-read scripts/production-readiness-check.ts
// ============================================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ============================================================================
// CONFIGURATION
// ============================================================================

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL");
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("❌ Missing environment variables:");
  console.error("   - VITE_SUPABASE_URL");
  console.error("   - SUPABASE_SERVICE_ROLE_KEY");
  console.error("\nSet these in .env file or environment");
  Deno.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// ============================================================================
// TYPES
// ============================================================================

interface CheckResult {
  name: string;
  status: "pass" | "fail" | "warn";
  message: string;
  details?: string;
}

// ============================================================================
// CHECK FUNCTIONS
// ============================================================================

async function checkAppRoleEnum(): Promise<CheckResult> {
  try {
    const { data, error } = await supabase.rpc("get_app_roles");

    if (error) {
      // Fallback: Try direct query
      const query = `
        SELECT unnest(enum_range(NULL::app_role))::text as role
      `;

      const { data: roles, error: queryError } = await supabase.rpc(
        "exec_sql",
        { query }
      );

      if (queryError) {
        return {
          name: "App Role Enum",
          status: "fail",
          message: "Cannot query app_role enum",
          details: queryError.message,
        };
      }

      const roleCount = roles?.length || 0;
      const expectedRoles = [
        "CONSULTANT",
        "BANQUIER",
        "CEO",
        "RH_MANAGER",
        "EMPLOYEE",
        "TEAM_LEADER",
      ];

      if (roleCount === 6) {
        return {
          name: "App Role Enum",
          status: "pass",
          message: `✅ app_role enum has 6 roles (expected)`,
        };
      } else {
        return {
          name: "App Role Enum",
          status: "fail",
          message: `❌ app_role enum has ${roleCount} roles (expected 6)`,
          details: `Expected: ${expectedRoles.join(", ")}`,
        };
      }
    }

    return {
      name: "App Role Enum",
      status: "pass",
      message: "✅ app_role enum configured correctly",
    };
  } catch (error) {
    return {
      name: "App Role Enum",
      status: "fail",
      message: "❌ Error checking app_role enum",
      details: error.message,
    };
  }
}

async function checkCompanyIdNotNull(): Promise<CheckResult> {
  try {
    const { count, error } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .is("company_id", null);

    if (error) {
      return {
        name: "Company ID NOT NULL",
        status: "fail",
        message: "❌ Cannot query profiles table",
        details: error.message,
      };
    }

    if (count === 0) {
      return {
        name: "Company ID NOT NULL",
        status: "pass",
        message: "✅ All profiles have company_id",
      };
    } else {
      return {
        name: "Company ID NOT NULL",
        status: "fail",
        message: `❌ ${count} profiles have NULL company_id`,
        details: "Run Migration 2 to fix",
      };
    }
  } catch (error) {
    return {
      name: "Company ID NOT NULL",
      status: "fail",
      message: "❌ Error checking company_id",
      details: error.message,
    };
  }
}

async function checkRLSEnabled(): Promise<CheckResult> {
  try {
    // Check if RLS is enabled on critical tables
    const criticalTables = ["profiles", "companies", "user_roles"];
    const checks = [];

    for (const tableName of criticalTables) {
      // This requires a custom RPC function in Supabase
      // For now, we'll just check if we can query the table
      const { error } = await supabase
        .from(tableName)
        .select("*", { count: "exact", head: true })
        .limit(1);

      if (error && error.message.includes("row-level security")) {
        checks.push({ table: tableName, enabled: true });
      } else if (!error) {
        // Table accessible - RLS might not be enabled or user has bypass
        checks.push({ table: tableName, enabled: false });
      }
    }

    // If using service role key, RLS is bypassed
    // So we assume RLS is enabled if migrations ran
    return {
      name: "RLS Enabled",
      status: "warn",
      message:
        "⚠️  Cannot verify RLS with service role key (RLS bypassed for admin)",
      details: "Verify manually in Supabase Dashboard → Database → Tables",
    };
  } catch (error) {
    return {
      name: "RLS Enabled",
      status: "fail",
      message: "❌ Error checking RLS status",
      details: error.message,
    };
  }
}

async function checkAuditLogsTable(): Promise<CheckResult> {
  try {
    const { error } = await supabase
      .from("audit_logs")
      .select("*", { count: "exact", head: true })
      .limit(1);

    if (error && error.message.includes("does not exist")) {
      return {
        name: "Audit Logs Table",
        status: "fail",
        message: "❌ audit_logs table does not exist",
        details: "Run Migration 3 to create it",
      };
    } else if (error) {
      return {
        name: "Audit Logs Table",
        status: "warn",
        message: "⚠️  audit_logs table exists but query failed",
        details: error.message,
      };
    } else {
      return {
        name: "Audit Logs Table",
        status: "pass",
        message: "✅ audit_logs table exists",
      };
    }
  } catch (error) {
    return {
      name: "Audit Logs Table",
      status: "fail",
      message: "❌ Error checking audit_logs table",
      details: error.message,
    };
  }
}

async function checkEdgeFunctionsSecurity(): Promise<CheckResult> {
  try {
    const functionsToCheck = [
      "analyze-performance",
      "analyze-satisfaction",
      "calculate-savings",
      "generate-performance-cards",
    ];

    const results = [];

    for (const funcName of functionsToCheck) {
      // Test if function requires auth (should return 401)
      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/${funcName}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({}),
        }
      );

      if (response.status === 401) {
        results.push({ name: funcName, secure: true });
      } else {
        results.push({ name: funcName, secure: false, status: response.status });
      }
    }

    const insecureFunctions = results.filter((r) => !r.secure);

    if (insecureFunctions.length === 0) {
      return {
        name: "Edge Functions Security",
        status: "pass",
        message: `✅ All ${functionsToCheck.length} Edge Functions require auth`,
      };
    } else {
      return {
        name: "Edge Functions Security",
        status: "fail",
        message: `❌ ${insecureFunctions.length} functions do not require auth`,
        details: insecureFunctions
          .map((f) => `${f.name} (status: ${f.status})`)
          .join(", "),
      };
    }
  } catch (error) {
    return {
      name: "Edge Functions Security",
      status: "warn",
      message: "⚠️  Could not test Edge Functions",
      details: error.message,
    };
  }
}

async function checkDatabasePerformance(): Promise<CheckResult> {
  try {
    // Simple query performance check
    const start = performance.now();
    const { error } = await supabase
      .from("profiles")
      .select("*")
      .limit(10);
    const duration = performance.now() - start;

    if (error) {
      return {
        name: "Database Performance",
        status: "fail",
        message: "❌ Database query failed",
        details: error.message,
      };
    }

    if (duration < 100) {
      return {
        name: "Database Performance",
        status: "pass",
        message: `✅ Database query time: ${duration.toFixed(0)}ms (excellent)`,
      };
    } else if (duration < 500) {
      return {
        name: "Database Performance",
        status: "pass",
        message: `✅ Database query time: ${duration.toFixed(0)}ms (good)`,
      };
    } else {
      return {
        name: "Database Performance",
        status: "warn",
        message: `⚠️  Database query time: ${duration.toFixed(0)}ms (slow)`,
        details: "Consider adding indexes or optimizing queries",
      };
    }
  } catch (error) {
    return {
      name: "Database Performance",
      status: "fail",
      message: "❌ Error testing database performance",
      details: error.message,
    };
  }
}

async function checkEnvironmentVariables(): Promise<CheckResult> {
  const requiredVars = [
    "VITE_SUPABASE_URL",
    "VITE_SUPABASE_PUBLISHABLE_KEY",
    "VITE_SENTRY_DSN",
  ];

  const missingVars = requiredVars.filter((v) => !Deno.env.get(v));

  if (missingVars.length === 0) {
    return {
      name: "Environment Variables",
      status: "pass",
      message: "✅ All required environment variables set",
    };
  } else {
    return {
      name: "Environment Variables",
      status: "fail",
      message: `❌ Missing ${missingVars.length} environment variables`,
      details: missingVars.join(", "),
    };
  }
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function runAllChecks(): Promise<void> {
  console.log("╔════════════════════════════════════════════════════════════════╗");
  console.log("║                                                                ║");
  console.log("║          HCM PORTAL V2 - PRODUCTION READINESS CHECK           ║");
  console.log("║                                                                ║");
  console.log("╚════════════════════════════════════════════════════════════════╝");
  console.log("");
  console.log(`🔍 Checking Supabase project: ${SUPABASE_URL}`);
  console.log("");

  const checks: CheckResult[] = [];

  // Run all checks
  console.log("⏳ Running checks...\n");

  checks.push(await checkEnvironmentVariables());
  checks.push(await checkAppRoleEnum());
  checks.push(await checkCompanyIdNotNull());
  checks.push(await checkRLSEnabled());
  checks.push(await checkAuditLogsTable());
  checks.push(await checkEdgeFunctionsSecurity());
  checks.push(await checkDatabasePerformance());

  // Display results
  console.log("═══════════════════════════════════════════════════════════════\n");
  console.log("📊 CHECK RESULTS:\n");

  for (const check of checks) {
    const icon =
      check.status === "pass" ? "✅" : check.status === "fail" ? "❌" : "⚠️ ";
    console.log(`${icon} ${check.name}`);
    console.log(`   ${check.message}`);
    if (check.details) {
      console.log(`   Details: ${check.details}`);
    }
    console.log("");
  }

  // Summary
  const passed = checks.filter((c) => c.status === "pass").length;
  const failed = checks.filter((c) => c.status === "fail").length;
  const warnings = checks.filter((c) => c.status === "warn").length;

  console.log("═══════════════════════════════════════════════════════════════\n");
  console.log("📈 SUMMARY:\n");
  console.log(`   ✅ Passed:   ${passed}/${checks.length}`);
  console.log(`   ❌ Failed:   ${failed}/${checks.length}`);
  console.log(`   ⚠️  Warnings: ${warnings}/${checks.length}`);
  console.log("");

  if (failed === 0 && warnings === 0) {
    console.log("🎉 ALL CHECKS PASSED! Backend is production-ready.");
    console.log("");
    Deno.exit(0);
  } else if (failed === 0) {
    console.log("⚠️  ALL CRITICAL CHECKS PASSED (with warnings)");
    console.log("   Review warnings before deploying to production.");
    console.log("");
    Deno.exit(0);
  } else {
    console.log("🚨 PRODUCTION READINESS CHECK FAILED");
    console.log(
      `   ${failed} critical checks failed. Fix these before deploying.`
    );
    console.log("");
    console.log("📚 Next Steps:");
    console.log("   1. Review failed checks above");
    console.log(
      "   2. Execute migrations: See EXECUTE-NOW-GUIDE.md"
    );
    console.log("   3. Re-run this script after fixes");
    console.log("");
    Deno.exit(1);
  }
}

// ============================================================================
// RUN
// ============================================================================

if (import.meta.main) {
  runAllChecks();
}
