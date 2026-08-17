"use client";

import { FormEvent, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { businessTypes, validateBusinessApplication, type Business, type BusinessErrors, type BusinessFormValues, type BusinessType } from "../business";

export function PartnerApplicationForm({ ownerId, initialBusiness }: { ownerId: string; initialBusiness: Business | null }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [errors, setErrors] = useState<BusinessErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    const form = new FormData(event.currentTarget);
    const values: BusinessFormValues = {
      business_name: String(form.get("business_name") ?? ""), business_type: String(form.get("business_type") ?? "") as BusinessType,
      description: String(form.get("description") ?? ""), country: String(form.get("country") ?? ""), city: String(form.get("city") ?? ""),
      contact_name: String(form.get("contact_name") ?? ""), contact_email: String(form.get("contact_email") ?? ""), phone: String(form.get("phone") ?? ""),
      website_url: String(form.get("website_url") ?? ""), agreement: form.get("agreement") === "on",
    };
    const nextErrors = validateBusinessApplication(values);
    setErrors(nextErrors); setMessage("");
    if (Object.keys(nextErrors).length) { requestAnimationFrame(() => formRef.current?.querySelector<HTMLElement>("[aria-invalid='true']")?.focus()); return; }

    setSubmitting(true);
    const payload = { business_name: values.business_name.trim(), business_type: values.business_type, description: values.description.trim(), country: values.country.trim(), city: values.city.trim(), contact_name: values.contact_name.trim(), contact_email: values.contact_email.trim(), phone: values.phone.trim(), website_url: values.website_url.trim() || null };
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user || user.id !== ownerId) { router.push("/sign-in?redirectTo=%2Fpartner%2Fapply"); return; }

    let error;
    if (initialBusiness) {
      const result = await supabase.from("businesses").update(payload).eq("id", initialBusiness.id).eq("owner_id", user.id).eq("status", "pending").select("id").maybeSingle();
      error = result.error;
      if (!error && !result.data) {
        setSubmitting(false);
        setMessage("This application is no longer pending and cannot be edited.");
        return;
      }
    } else {
      ({ error } = await supabase.from("businesses").insert({ ...payload, owner_id: user.id }));
    }
    if (error) {
      setSubmitting(false);
      setMessage(error.code === "23505" ? "You already have a business application. Open your partner dashboard to view it." : "We could not save your application. Please try again.");
      return;
    }
    router.push(`/partner/dashboard?success=${initialBusiness ? "updated" : "submitted"}`);
    router.refresh();
  }

  const field = (name: keyof BusinessErrors) => ({ "aria-invalid": Boolean(errors[name]), "aria-describedby": errors[name] ? `${name}-error` : undefined });
  return <form className="partner-form-card" ref={formRef} onSubmit={handleSubmit} noValidate>
    <div className="partner-form-heading"><p>Business details</p><h2>{initialBusiness ? "Update your information" : "Apply to become a partner"}</h2><span>Fields marked * are required.</span></div>
    <div className="partner-fields">
      <div className="partner-field"><label htmlFor="business_name">Business name *</label><input id="business_name" name="business_name" defaultValue={initialBusiness?.business_name} required maxLength={200} disabled={submitting} {...field("business_name")} />{errors.business_name && <p id="business_name-error">{errors.business_name}</p>}</div>
      <div className="partner-field"><label htmlFor="business_type">Business type *</label><select id="business_type" name="business_type" defaultValue={initialBusiness?.business_type ?? ""} required disabled={submitting} {...field("business_type")}><option value="">Select a business type</option>{businessTypes.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select>{errors.business_type && <p id="business_type-error">{errors.business_type}</p>}</div>
      <div className="partner-field partner-field-wide"><label htmlFor="description">Short business description *</label><textarea id="description" name="description" defaultValue={initialBusiness?.description} required maxLength={2000} rows={5} disabled={submitting} {...field("description")} />{errors.description && <p id="description-error">{errors.description}</p>}</div>
      <div className="partner-field"><label htmlFor="country">Country *</label><input id="country" name="country" autoComplete="country-name" defaultValue={initialBusiness?.country} required maxLength={120} disabled={submitting} {...field("country")} />{errors.country && <p id="country-error">{errors.country}</p>}</div>
      <div className="partner-field"><label htmlFor="city">City or location *</label><input id="city" name="city" autoComplete="address-level2" defaultValue={initialBusiness?.city} required maxLength={160} disabled={submitting} {...field("city")} />{errors.city && <p id="city-error">{errors.city}</p>}</div>
      <div className="partner-field"><label htmlFor="contact_name">Contact person’s name *</label><input id="contact_name" name="contact_name" autoComplete="name" defaultValue={initialBusiness?.contact_name} required maxLength={200} disabled={submitting} {...field("contact_name")} />{errors.contact_name && <p id="contact_name-error">{errors.contact_name}</p>}</div>
      <div className="partner-field"><label htmlFor="contact_email">Business email *</label><input id="contact_email" name="contact_email" type="email" autoComplete="email" inputMode="email" defaultValue={initialBusiness?.contact_email} required maxLength={320} disabled={submitting} {...field("contact_email")} />{errors.contact_email && <p id="contact_email-error">{errors.contact_email}</p>}</div>
      <div className="partner-field"><label htmlFor="phone">Phone number *</label><input id="phone" name="phone" type="tel" autoComplete="tel" defaultValue={initialBusiness?.phone} required maxLength={50} disabled={submitting} {...field("phone")} />{errors.phone && <p id="phone-error">{errors.phone}</p>}</div>
      <div className="partner-field"><label htmlFor="website_url">Website or social-media link <span>(optional)</span></label><input id="website_url" name="website_url" type="url" inputMode="url" placeholder="https://" defaultValue={initialBusiness?.website_url ?? ""} maxLength={2048} disabled={submitting} {...field("website_url")} />{errors.website_url && <p id="website_url-error">{errors.website_url}</p>}</div>
    </div>
    <div className="partner-agreement"><input id="agreement" name="agreement" type="checkbox" disabled={submitting} {...field("agreement")} /><label htmlFor="agreement">I confirm that the information provided is correct. *</label></div>{errors.agreement && <p className="partner-agreement-error" id="agreement-error">{errors.agreement}</p>}
    {message && <p className="partner-submit-error" role="alert">{message}</p>}
    <button className="button partner-submit" type="submit" disabled={submitting} aria-busy={submitting}>{submitting ? "Saving application…" : initialBusiness ? "Save changes" : "Submit application"}</button>
  </form>;
}
