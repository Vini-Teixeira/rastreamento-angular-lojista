import { Pipe, PipeTransform } from '@angular/core';
import { DeliveryStatus } from '../../core/enums/delivery-status.enum';

@Pipe({
  name: 'formatStatus',
  standalone: true
})
export class FormatStatusPipe implements PipeTransform {
  transform(value: DeliveryStatus | string): string {
    switch (value) {
      case DeliveryStatus.PENDENTE:
        return 'Pendente';
      case DeliveryStatus.ACEITO:
        return 'Aceito';
      case DeliveryStatus.A_CAMINHO:
        return 'À caminho';
      case DeliveryStatus.EM_ATENDIMENTO:
        return 'Em Atendimento';
      case DeliveryStatus.FINALIZADO:
        return 'Finalizado';
      case DeliveryStatus.CANCELADO:
        return 'Cancelado';
      default:
        return 'Desconhecido';
    }
  }
}