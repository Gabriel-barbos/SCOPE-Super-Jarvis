import proxyApi from "@/services/proxyApi";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

export interface Client {
  _id: string;
  name: string;
  login: string;
  password: string;
  type: string;
}

export interface CreateClientDTO {
  name: string;
  login: string;
  password: string;
  type: string;
}

export interface UpdateClientDTO extends Partial<CreateClientDTO> {}


const api = axios.create({
  baseURL: "http://localhost:3001/api/clients",
});
export function useClients() {
  const queryClient = useQueryClient();

  //lista
  const clientsQuery = useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const { data } = await api.get<Client[]>("/");
      return data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutos “fresh”
  });

  //create
  const createClient = useMutation({
    mutationFn: async (payload: CreateClientDTO) => {
      const { data } = await api.post<Client>("/", payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
    },
  });


//update
  const updateClient = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateClientDTO;
    }) => {
      const response = await api.put<Client>(`/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
    },
  });

   const getById = (id?: string) =>
    useQuery({
      queryKey: ["clients", id],
      queryFn: async () => {
        const { data } = await api.get<Client>(`/${id}`);
        return data;
      },
      enabled: !!id, 
      staleTime: 1000 * 60 * 5,
    });

//delete
  const deleteClient = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
    },
  });

 
//api return
  return {
    clients: clientsQuery.data ?? [],
    isLoading: clientsQuery.isLoading,
    isError: clientsQuery.isError,
    error: clientsQuery.error,

    refetchClients: clientsQuery.refetch,
    getById,
    createClient: createClient.mutateAsync,
    updateClient: updateClient.mutateAsync,
    deleteClient: deleteClient.mutateAsync,

    isCreating: createClient.isPending,
    isUpdating: updateClient.isPending,
    isDeleting: deleteClient.isPending,
  };
}
