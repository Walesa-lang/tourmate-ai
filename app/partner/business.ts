import type { Database } from "@/utils/supabase/database.types";

export const businessTypes = [
  ["accommodation", "Hotel or accommodation"],
  ["car_rental", "Car rental"],
  ["tour_operator", "Tour operator"],
  ["restaurant", "Restaurant"],
  ["attraction", "Attraction or activity provider"],
  ["other", "Other travel service"],
] as const;

export type BusinessType = (typeof businessTypes)[number][0];
export type Business = Database["public"]["Tables"]["businesses"]["Row"];
export type BusinessFormValues = Pick<Business, "business_name" | "business_type" | "description" | "country" | "city" | "contact_name" | "contact_email" | "phone"> & { website_url: string; agreement: boolean };
export type BusinessField = keyof BusinessFormValues;
export type BusinessErrors = Partial<Record<BusinessField, string>>;

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateBusinessApplication(values: BusinessFormValues): BusinessErrors {
  const errors: BusinessErrors = {};
  if (!values.business_name.trim()) errors.business_name = "Enter your business name.";
  if (!businessTypes.some(([value]) => value === values.business_type)) errors.business_type = "Select a business type.";
  if (!values.description.trim()) errors.description = "Add a short business description.";
  if (!values.country.trim()) errors.country = "Enter the country where your business operates.";
  if (!values.city.trim()) errors.city = "Enter your city or location.";
  if (!values.contact_name.trim()) errors.contact_name = "Enter the contact person's name.";
  if (!values.contact_email.trim()) errors.contact_email = "Enter a business email.";
  else if (!emailPattern.test(values.contact_email.trim())) errors.contact_email = "Enter a valid business email.";
  if (!values.phone.trim()) errors.phone = "Enter a phone number.";
  if (values.website_url.trim()) {
    try {
      const url = new URL(values.website_url.trim());
      if (!['http:', 'https:'].includes(url.protocol)) throw new Error();
    } catch {
      errors.website_url = "Enter a valid website or social-media URL beginning with http:// or https://.";
    }
  }
  if (!values.agreement) errors.agreement = "Confirm that the information is correct.";
  return errors;
}

export function businessTypeLabel(value: BusinessType) {
  return businessTypes.find(([key]) => key === value)?.[1] ?? value;
}
