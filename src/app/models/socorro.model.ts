import { DeliveryLocation } from '../services/entregas.service'; 
import { SocorroStatus } from '../core/enums/socorro-status.enum';

export interface Socorro {
  _id: string;
  codigoSocorro: string;
  solicitanteId: string; 
  driverId?: string; 
  status: SocorroStatus;
  clientLocation: DeliveryLocation; 

  clienteNome: string;
  clienteTelefone: string;
  placaVeiculo?: string;
  modeloVeiculo?: string;

  serviceDescription?: string;
  checkInLiberadoManualmente: boolean;
  fotos: string[];
  createdAt?: string;
  updateAt?: string;
}