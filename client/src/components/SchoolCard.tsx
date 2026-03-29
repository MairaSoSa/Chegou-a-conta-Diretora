import { School } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Users, Building, AlertTriangle, CheckCircle2 } from "@/components/Icons";

export function SchoolCard({ school }: { school: School }) {
  const isDataComplete = school.dataStatus === "Completo";

  return (
    <Card className="glass-card hover:border-primary/50 transition-colors">
      <CardHeader className="flex flex-row items-start justify-between pb-2">
        <div>
          <Badge variant="outline" className="mb-2 border-white/10 text-muted-foreground">
            INEP: {school.inep}
          </Badge>
          <CardTitle className="text-xl font-bold text-white leading-tight">
            {school.name}
          </CardTitle>
        </div>
        {isDataComplete ? (
          <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Regular
          </Badge>
        ) : (
          <Badge variant="destructive" className="bg-red-500/10 text-red-500 border-red-500/20">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Pendência
          </Badge>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="w-4 h-4 text-primary" />
            <span>{school.city} - {school.state}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="w-4 h-4 text-primary" />
            <span>{school.enrollmentCount} Alunos</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Building className="w-4 h-4 text-primary" />
            <span>{school.network} ({school.location})</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
