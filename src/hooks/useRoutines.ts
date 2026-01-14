export interface Routine {
  _id: string;
  name: string;

  client: {
    _id: string;
    name: string;
    login: string;
  };

  addVehicleToGroup: boolean;
  vehicleGroup?: string | null;

  shareVehicle: boolean;
  shareGroup?: string | null;

  createdAt: string;
  updatedAt: string;
}

export interface CreateRoutineDTO {
  name: string;
  client: string; 

  addVehicleToGroup: boolean;
  vehicleGroup?: string | null;

  shareVehicle: boolean;
  shareGroup?: string | null;
}

export interface UpdateRoutineDTO extends Partial<CreateRoutineDTO> {}


import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:3001/api/routines",
});

export function useRoutines() {
  const queryClient = useQueryClient();

  // LISTA
  const routinesQuery = useQuery({
    queryKey: ["routines"],
    queryFn: async () => {
      const { data } = await api.get<Routine[]>("/");
      return data;
    },
    staleTime: 1000 * 60 * 5,
  });

 //create
  const createRoutine = useMutation({
    mutationFn: async (payload: CreateRoutineDTO) => {
      const { data } = await api.post<Routine>("/", payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["routines"] });
    },
  });

    //update
  const updateRoutine = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateRoutineDTO;
    }) => {
      const response = await api.put<Routine>(`/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["routines"] });
    },
  });

    //get by id
  const getById = (id?: string) =>
    useQuery({
      queryKey: ["routines", id],
      queryFn: async () => {
        const { data } = await api.get<Routine>(`/${id}`);
        return data;
      },
      enabled: !!id,
      staleTime: 1000 * 60 * 5,
    });

    //delete
  const deleteRoutine = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["routines"] });
    },
  });
//api return
  return {
    routines: routinesQuery.data ?? [],
    isLoading: routinesQuery.isLoading,
    isError: routinesQuery.isError,
    error: routinesQuery.error,

    refetchRoutines: routinesQuery.refetch,
    getById,

    createRoutine: createRoutine.mutateAsync,
    updateRoutine: updateRoutine.mutateAsync,
    deleteRoutine: deleteRoutine.mutateAsync,

    isCreating: createRoutine.isPending,
    isUpdating: updateRoutine.isPending,
    isDeleting: deleteRoutine.isPending,
  };
}
