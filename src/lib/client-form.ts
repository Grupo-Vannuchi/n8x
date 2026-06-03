import type { ClientInput } from "@/lib/validations/client";

/**
 * Bridges the admin clients form and the stored client shape. The form works
 * with flat string values (numbers as strings); `formToInput` maps those to the
 * structured `ClientInput` the server expects, and `clientToForm` does the
 * reverse so the edit form can be pre-filled. Kept free of "use client" /
 * "server-only" so both sides can import it.
 */

export type ClientFormValues = {
  name: string;
  logoUrl: string;
  website: string;
  order: string;
  published: boolean;
};

/** Blank form, used by the "new client" page. Defaults to published. */
export function emptyClientForm(): ClientFormValues {
  return {
    name: "",
    logoUrl: "",
    website: "",
    order: "0",
    published: true,
  };
}

/** Client row as stored (website may be null). */
type ClientRow = {
  name: string;
  logoUrl: string;
  website: string | null;
  order: number;
  published: boolean;
};

/** Pre-fill the form from a stored client (edit page). */
export function clientToForm(client: ClientRow): ClientFormValues {
  return {
    name: client.name,
    logoUrl: client.logoUrl,
    website: client.website ?? "",
    order: String(client.order),
    published: client.published,
  };
}

/** Map flat form values to the structured input the server validates. */
export function formToInput(values: ClientFormValues): ClientInput {
  return {
    name: values.name.trim(),
    logoUrl: values.logoUrl.trim(),
    website: values.website.trim(),
    order: Number(values.order),
    published: values.published,
  };
}
