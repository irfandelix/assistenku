import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata(props: Props) {
  try {
    const params = await props.params;
    const docRef = doc(db, "projects", params.id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      const title = data.title ? "File Proyek: " + data.title : "File Proyek";
      const clientName = data.client || data.pemrakarsa || "klien";
      const desc = "Akses aman untuk dokumen dan peta milik " + clientName + ".";

      return {
        title: title,
        description: desc,
        openGraph: {
          title: title,
          description: desc,
          siteName: "Proyek Irfan",
        }
      };
    }
  } catch (err) {
    console.error(err);
  }
  
  return {
    title: "Portal Klien",
    description: "Akses dokumen proyek Anda"
  };
}

export default function ProjectLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

