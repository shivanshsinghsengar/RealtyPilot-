"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { loginSchema, signupSchema } from "@/lib/validations/auth";

export interface AuthActionResult {
  success: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
}

function isNextRedirectError(err: unknown): boolean {
  if (typeof err === "object" && err !== null && "digest" in err) {
    const digest = (err as { digest?: string }).digest;
    return typeof digest === "string" && digest.startsWith("NEXT_REDIRECT");
  }
  return false;
}

function mapAuthErrorMessage(errorMsg: string): string {
  if (errorMsg.includes("Invalid login credentials")) {
    return "Incorrect email or password. Please check your credentials.";
  }
  if (errorMsg.includes("Email not confirmed")) {
    return "Please confirm your email address before signing in.";
  }
  if (errorMsg.includes("User already registered")) {
    return "An account with this email already exists. Please sign in instead.";
  }
  if (errorMsg.includes("rate limit")) {
    return "Too many attempts. Please wait a few moments before trying again.";
  }
  return errorMsg;
}

export async function loginAction(
  _prevState: AuthActionResult | null,
  formData: FormData
): Promise<AuthActionResult> {
  const rawData = {
    email: formData.get("email"),
    password: formData.get("password"),
  };

  const validation = loginSchema.safeParse(rawData);
  if (!validation.success) {
    return {
      success: false,
      error: "Validation failed. Please check the fields below.",
      fieldErrors: validation.error.flatten().fieldErrors,
    };
  }

  const { email, password } = validation.data;

  // In placeholder mode, grant developer access to preview dashboard
  if (process.env.NEXT_PUBLIC_SUPABASE_URL?.includes("placeholder")) {
    redirect("/dashboard");
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return {
        success: false,
        error: mapAuthErrorMessage(error.message),
      };
    }
  } catch (err: unknown) {
    if (isNextRedirectError(err)) {
      throw err;
    }
    return {
      success: false,
      error: err instanceof Error ? mapAuthErrorMessage(err.message) : "An unexpected authentication error occurred.",
    };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signupAction(
  _prevState: AuthActionResult | null,
  formData: FormData
): Promise<AuthActionResult> {
  const rawData = {
    full_name: formData.get("full_name"),
    email: formData.get("email"),
    password: formData.get("password"),
    role: "sales_rep", // Security enforced: strictly sales_rep for self-registration
  };

  const validation = signupSchema.safeParse(rawData);
  if (!validation.success) {
    return {
      success: false,
      error: "Validation failed. Please check the fields below.",
      fieldErrors: validation.error.flatten().fieldErrors,
    };
  }

  const { email, password, full_name, role } = validation.data;

  // In placeholder mode, grant developer access to preview dashboard
  if (process.env.NEXT_PUBLIC_SUPABASE_URL?.includes("placeholder")) {
    redirect("/dashboard");
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name,
          role,
        },
      },
    });

    if (error) {
      return {
        success: false,
        error: mapAuthErrorMessage(error.message),
      };
    }
  } catch (err: unknown) {
    if (isNextRedirectError(err)) {
      throw err;
    }
    return {
      success: false,
      error: err instanceof Error ? mapAuthErrorMessage(err.message) : "An unexpected signup error occurred.",
    };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function logoutAction() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL?.includes("placeholder")) {
    try {
      const supabase = await createClient();
      await supabase.auth.signOut();
    } catch {
      // Ignore signOut errors on redirect
    }
  }

  revalidatePath("/", "layout");
  redirect("/login");
}
