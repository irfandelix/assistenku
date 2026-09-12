import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata(props: Props) {
  try {
    const params = await props.params;
    const docRef = doc(db, "consultants", params.id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      const title = `Daftar Proyek: ${data.name}`;
      const desc = `Portal akses daftar proyek yang ditugaskan kepada ${data.name}.`;

      return {
        title: title,
        description: desc,
        openGraph: {
          title: title,
          description: desc,
          siteName: "Portal Konsultan",
        }
      };
    }
  } catch (err) {
    console.error(err);
  }
  
  return {
    title: "Portal Konsultan",
    description: "Akses daftar proyek konsultan"
  };
}

export default function ConsultantLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
