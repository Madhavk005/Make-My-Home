import { redirect } from "next/navigation";

/**
 * Kept as a redirect for old bookmarks. Catalogue and website content are
 * managed in Sanity Studio, not in a separate custom admin screen.
 */
export default function AdminCmsPage() {
  redirect("/studio");
}
