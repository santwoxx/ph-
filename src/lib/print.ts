import { formatCurrency, formatDateTime } from "./format";
import { PAYMENT_METHOD_LABEL, type Order, type StoreSettings, type Expense } from "./types";

// O pedido é escrito no Firestore diretamente pelo SDK do cliente (sem
// backend validando o conteúdo), então todo campo de texto — nome, telefone,
// endereço, observações, nome do item — precisa ser tratado como não
// confiável antes de entrar no HTML da comanda/relatório impressos via
// document.write. Sem isso, um pedido malicioso vira XSS rodando na sessão
// autenticada de quem imprime (o admin).
function escapeHtml(value: unknown): string {
  return String(value ?? "").replace(/[&<>"']/g, (ch) => {
    switch (ch) {
      case "&": return "&amp;";
      case "<": return "&lt;";
      case ">": return "&gt;";
      case '"': return "&quot;";
      default: return "&#39;";
    }
  });
}

export function printOrderReceipt(order: Order, settings: StoreSettings) {
  const printWindow = window.open('', '_blank', 'width=400,height=600');
  if (!printWindow) {
    alert("O bloqueador de pop-ups impediu a impressão. Por favor, permita pop-ups para este site.");
    return;
  }

  const itemsHtml = order.items.map(item => `
    <div class="item">
      <div class="item-name">${escapeHtml(item.qty)}x ${escapeHtml(item.name)} (${escapeHtml(item.size)})</div>
      ${item.extras.length > 0 ? `<div class="item-extras">+ ${escapeHtml(item.extras.map(e => e.name).join(', '))}</div>` : ''}
      <div class="item-price">${formatCurrency(item.lineTotal)}</div>
    </div>
  `).join('');

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Comanda #${order.id.slice(-6).toUpperCase()}</title>
        <style>
          @page { margin: 0; }
          body {
            font-family: 'Courier New', Courier, monospace;
            font-size: 14px;
            color: #000;
            margin: 0;
            padding: 15px 10px;
            width: 80mm;
            box-sizing: border-box;
          }
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          .font-bold { font-weight: bold; }
          .divider { border-top: 1px dashed #000; margin: 10px 0; }
          .store-name { font-size: 18px; font-weight: bold; margin-bottom: 5px; }
          .order-info { margin-bottom: 10px; }
          .customer-info { margin-bottom: 10px; }
          .item { margin-bottom: 8px; }
          .item-name { font-weight: bold; }
          .item-extras { font-size: 12px; padding-left: 10px; }
          .item-price { text-align: right; }
          .totals { margin-top: 10px; }
          .totals-row { display: flex; justify-content: space-between; margin-bottom: 4px; }
          .grand-total { font-size: 16px; font-weight: bold; border-top: 1px solid #000; padding-top: 4px; margin-top: 4px; }
        </style>
      </head>
      <body>
        <div class="text-center">
          <div class="store-name">${escapeHtml(settings.storeName)}</div>
          ${settings.whatsapp ? `<div>${escapeHtml(settings.whatsapp)}</div>` : ''}
        </div>

        <div class="divider"></div>

        <div class="order-info">
          <div class="font-bold text-center" style="font-size: 16px;">PEDIDO #${escapeHtml(order.id.slice(-6).toUpperCase())}</div>
          <div style="margin-top: 5px;">Data: ${formatDateTime(order.createdAt)}</div>
          <div>Tipo: <span class="font-bold">${order.deliveryType === 'delivery' ? 'ENTREGA' : 'RETIRADA'}</span></div>
          ${order.scheduledTo ? `<div>Agendado para: <span class="font-bold">${escapeHtml(order.scheduledTo)}</span></div>` : ''}
        </div>

        <div class="divider"></div>

        <div class="customer-info">
          <div class="font-bold">CLIENTE:</div>
          <div>${escapeHtml(order.customerName)}</div>
          <div>Fone: ${escapeHtml(order.customerPhone)}</div>
          ${order.deliveryType === 'delivery' && order.address ? `
            <div style="margin-top: 5px;">
              <div class="font-bold">ENDEREÇO DE ENTREGA:</div>
              <div>${escapeHtml(order.address.street)}, ${escapeHtml(order.address.number)}</div>
              <div>Bairro: ${escapeHtml(order.address.district)}</div>
              ${order.address.complement ? `<div>Comp: ${escapeHtml(order.address.complement)}</div>` : ''}
              <div>${escapeHtml(order.address.city)}</div>
            </div>
          ` : ''}
        </div>

        <div class="divider"></div>

        <div class="font-bold" style="margin-bottom: 5px;">ITENS DO PEDIDO:</div>
        ${itemsHtml}

        ${order.notes ? `
          <div class="divider"></div>
          <div class="font-bold">OBSERVAÇÕES DO CLIENTE:</div>
          <div style="border: 1px solid #000; padding: 5px; margin-top: 5px;">${escapeHtml(order.notes)}</div>
        ` : ''}

        <div class="divider"></div>
        
        <div class="totals">
          <div class="totals-row">
            <span>Subtotal</span>
            <span>${formatCurrency(order.subtotal)}</span>
          </div>
          ${order.deliveryType === 'delivery' ? `
            <div class="totals-row">
              <span>Taxa de Entrega</span>
              <span>${formatCurrency(order.deliveryFee)}</span>
            </div>
          ` : ''}
          ${order.discount > 0 ? `
            <div class="totals-row">
              <span>Desconto</span>
              <span>-${formatCurrency(order.discount)}</span>
            </div>
          ` : ''}
          <div class="totals-row grand-total">
            <span>TOTAL</span>
            <span>${formatCurrency(order.total)}</span>
          </div>
        </div>

        <div class="divider"></div>
        
        <div>
          <div class="font-bold">PAGAMENTO:</div>
          <div>${PAYMENT_METHOD_LABEL[order.paymentMethod]}</div>
          ${order.changeFor ? `<div>Levar troco para: <span class="font-bold">${formatCurrency(order.changeFor)}</span></div>` : ''}
        </div>
        
        <div class="divider"></div>
        
        <div class="text-center" style="margin-top: 20px;">
          <div>Obrigado pela preferência!</div>
        </div>
        
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
              // Try to close only if it is a popup
              setTimeout(function() { window.close(); }, 500);
            }, 500);
          }
        </script>
      </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
}

export function printCashReport(orders: Order[], expenses: Expense[], settings: StoreSettings, dateLabel: string) {
  const printWindow = window.open('', '_blank', 'width=400,height=600');
  if (!printWindow) {
    alert("O bloqueador de pop-ups impediu a impressão. Por favor, permita pop-ups para este site.");
    return;
  }

  let totalPix = 0;
  let totalCard = 0;
  let totalCash = 0;
  
  const validOrders = orders.filter(o => o.status !== "cancelled");

  validOrders.forEach(o => {
    if (o.paymentMethod === "pix") totalPix += o.total;
    else if (o.paymentMethod === "cartao") totalCard += o.total;
    else if (o.paymentMethod === "dinheiro") totalCash += o.total;
  });

  const totalRevenue = totalPix + totalCard + totalCash;
  const totalExpenses = expenses.reduce((acc, e) => acc + e.amount, 0);
  const netProfit = totalRevenue - totalExpenses;

  const expensesHtml = expenses.length > 0
    ? expenses.map(e => `
      <div class="totals-row" style="margin-bottom: 2px;">
        <span style="font-size: 12px;">${escapeHtml(e.description)}</span>
        <span style="font-size: 12px;">${formatCurrency(e.amount)}</span>
      </div>
    `).join('')
    : '<div class="text-center" style="font-size: 12px;">Nenhuma despesa registrada.</div>';

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Fechamento de Caixa - ${dateLabel}</title>
        <style>
          @page { margin: 0; }
          body {
            font-family: 'Courier New', Courier, monospace;
            font-size: 14px;
            color: #000;
            margin: 0;
            padding: 15px 10px;
            width: 80mm;
            box-sizing: border-box;
          }
          .text-center { text-align: center; }
          .font-bold { font-weight: bold; }
          .divider { border-top: 1px dashed #000; margin: 10px 0; }
          .store-name { font-size: 18px; font-weight: bold; margin-bottom: 5px; }
          .totals-row { display: flex; justify-content: space-between; margin-bottom: 4px; }
          .grand-total { font-size: 16px; font-weight: bold; border-top: 1px solid #000; padding-top: 4px; margin-top: 4px; }
        </style>
      </head>
      <body>
        <div class="text-center">
          <div class="store-name">${escapeHtml(settings.storeName)}</div>
        </div>

        <div class="divider"></div>

        <div class="text-center">
          <div class="font-bold" style="font-size: 16px;">FECHAMENTO DE CAIXA</div>
          <div style="margin-top: 5px;">Data: ${escapeHtml(dateLabel)}</div>
        </div>
        
        <div class="divider"></div>
        
        <div class="font-bold" style="margin-bottom: 5px;">ENTRADAS (RECEITAS)</div>
        <div class="totals-row">
          <span>PIX</span>
          <span>${formatCurrency(totalPix)}</span>
        </div>
        <div class="totals-row">
          <span>Cartões (Crédito/Débito/VR)</span>
          <span>${formatCurrency(totalCard)}</span>
        </div>
        <div class="totals-row">
          <span>Dinheiro Físico</span>
          <span>${formatCurrency(totalCash)}</span>
        </div>
        
        <div class="totals-row grand-total">
          <span>TOTAL ENTRADAS</span>
          <span>${formatCurrency(totalRevenue)}</span>
        </div>

        <div class="divider"></div>
        
        <div class="font-bold" style="margin-bottom: 5px;">SAÍDAS (DESPESAS)</div>
        ${expensesHtml}
        
        <div class="totals-row grand-total" style="color: #444;">
          <span>TOTAL SAÍDAS</span>
          <span>-${formatCurrency(totalExpenses)}</span>
        </div>

        <div class="divider"></div>
        
        <div class="totals-row grand-total" style="font-size: 18px;">
          <span>LUCRO LÍQUIDO</span>
          <span>${formatCurrency(netProfit)}</span>
        </div>

        <div class="divider"></div>
        
        <div class="text-center" style="margin-top: 10px; font-size: 12px;">
          <div>Total de pedidos válidos: ${validOrders.length}</div>
          <div>Pedidos cancelados: ${orders.length - validOrders.length}</div>
        </div>
        
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            }, 500);
          }
        </script>
      </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
}
