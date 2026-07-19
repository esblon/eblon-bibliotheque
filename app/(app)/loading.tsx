import { Skeleton } from "@/components/ui/skeleton"
export default function Loading(){return <div className="space-y-4" aria-label="Chargement"><Skeleton className="h-9 w-64"/><Skeleton className="h-10 w-full max-w-md"/><Skeleton className="h-28 w-full"/><Skeleton className="h-28 w-full"/></div>}
