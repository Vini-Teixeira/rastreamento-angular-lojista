import { Pipe, PipeTransform } from '@angular/core';
import { DeliveryStatus } from '../../core/enums/delivery-status.enum';
import { SocorroStatus } from '../../core/enums/socorro-status.enum';

@Pipe({
  name: 'formatStatus',
  standalone: true,
})
export class FormatStatusPipe implements PipeTransform {
  transform(value: DeliveryStatus | string): string {
    const upperValue = String(value).toUpperCase();

    switch (upperValue) {
      case DeliveryStatus.PENDENTE:
        return 'Pendente';
      case DeliveryStatus.ACEITO:
        return 'Aceito';
      case DeliveryStatus.A_CAMINHO:
        return 'À caminho';
      case DeliveryStatus.NO_LOCAL:
        return 'No Local';
      case DeliveryStatus.EM_ATENDIMENTO:
        return 'Em Atendimento';
      case DeliveryStatus.FINALIZADO:
        return 'Finalizado';
      case DeliveryStatus.CANCELADO:
        return 'Cancelado';
      case DeliveryStatus.UNASSIGNED:
      case 'UNASSIGNED':
        return 'Não Atribuído';

      case SocorroStatus.PENDING:
      case 'PENDENTE':
        return 'Pendente';
      case SocorroStatus.ACCEPTED:
      case 'ACEITO':
        return 'Aceito';
      case SocorroStatus.ON_THE_WAY:
      case 'A_CAMINHO':
        return 'A caminho';
      case SocorroStatus.ON_SITE:
      case 'NO_LOCAL':
        return 'No local';
      case SocorroStatus.COMPLETED:
      case 'CONCLUÍDO':
        return 'Concluído';
      case SocorroStatus.CANCELLED:
      case 'CANCELADO':
        return 'Cancelado';

      default:
        const str = String(value);
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    }
  }
}
