// Máscara e validação de CPF (algoritmo padrão dos dígitos verificadores).

export function formatCPF(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  return digits
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

export function isValidCPF(value: string): boolean {
  const cpf = value.replace(/\D/g, "");
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;

  function checkDigit(base: string): number {
    let sum = 0;
    for (let i = 0; i < base.length; i++) {
      sum += parseInt(base[i], 10) * (base.length + 1 - i);
    }
    const rest = (sum * 10) % 11;
    return rest === 10 ? 0 : rest;
  }

  const digit1 = checkDigit(cpf.slice(0, 9));
  const digit2 = checkDigit(cpf.slice(0, 10));
  return digit1 === parseInt(cpf[9], 10) && digit2 === parseInt(cpf[10], 10);
}
