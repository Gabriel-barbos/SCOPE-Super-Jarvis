import { Pencil, Trash2, Clock, Users, Share2, FolderDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRoutines, Routine } from "@/hooks/useRoutines";
import { cn } from "@/lib/utils";

interface RoutineListProps {
    onEdit: (routineId: string) => void;
}

export function RoutineList({ onEdit }: RoutineListProps) {
    const { routines, isLoading, isError, deleteRoutine, isDeleting } = useRoutines();

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <p className="text-sm text-muted-foreground">Carregando rotinas...</p>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="flex items-center justify-center py-12">
                <Clock className="w-12 h-12 text-muted-foreground/40 mb-3" />
                <p className="text-sm text-destructive">Erro ao carregar rotinas</p>
            </div>
        );
    }

    if (!routines.length) {
        return (
            <div className="flex flex-col items-center justify-center py-12 px-4">
                <Clock className="w-12 h-12 text-muted-foreground/40 mb-3" />
                <p className="text-sm text-muted-foreground">Nenhuma rotina cadastrada ainda.</p>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {routines.map((routine) => (
                <RoutineRow
                    key={routine._id}
                    routine={routine}
                    onEdit={onEdit}
                    onDelete={deleteRoutine}
                    isDeleting={isDeleting}
                />
            ))}
        </div>
    );
}

interface RoutineRowProps {
    routine: Routine;
    onEdit: (id: string) => void;
    onDelete: (id: string) => Promise<void>;
    isDeleting: boolean;
}

function RoutineRow({ routine, onEdit, onDelete, isDeleting }: RoutineRowProps) {
    return (
        <div
            className={cn(
                "flex items-center justify-between rounded-lg border bg-card p-4",
                "hover:bg-muted/40 hover:border-primary/20 transition-all"
            )}
        >
            <div className="flex-1 space-y-1.5">
                <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-base">{routine.name}</h3>

                    {(routine.addVehicleToGroup || routine.shareVehicle) && (
                        <div className="flex gap-1">
                            {routine.addVehicleToGroup && (
                                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-md bg-primary/10 text-primary text-xs font-medium">
                                    <FolderDown  className="w-3 h-3" />
                                    Grupo
                                </span>
                            )}
                            {routine.shareVehicle && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 text-xs font-medium">
                                    <Share2 className="w-3 h-3" />
                                    Share
                                </span>
                            )}
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="w-4 h-4" />
                    <span>{routine.client?.name}</span>
                </div>
            </div>

            <div className="flex gap-2">
                <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onEdit(routine._id)}
                >
                    <Pencil className="w-4 h-4" />
                </Button>

                <Button
                    size="sm"
                    variant="outline"
                    disabled={isDeleting}
                    onClick={() => onDelete(routine._id)}
                >
                    <Trash2 className="w-4 h-4 text-red-500" />
                </Button>
            </div>
        </div>
    );
}