import { Component } from '@angular/core';
import { TransacaoService } from '../../data/TransacaoService';

@Component({
  selector: 'app-debug-api',
  templateUrl: './debug-api.component.html',
  standalone: true,
  // nenhum import necessário no template simples
})
export class DebugApiComponent {
  message = '';

  constructor(private transacaoService: TransacaoService) {}

  async onCreateDespesa() {
    this.message = 'Enviando...';

    const payload = {
      descricao: 'Teste Angular',
      valor: 123.45,
      data: new Date().toISOString(),
      categoria_id: 1,
    };

    try {
      const created = await this.transacaoService.createDespesa(payload as any);
      // mostrar id/objeto simples
      const id = (created as any)?.id ?? 'sem id';
      this.message = `Sucesso: despesa criada (id=${id})`;
    } catch (err) {
      this.message = `Erro: ${(err as Error).message ?? String(err)}`;
    }
  }
}
