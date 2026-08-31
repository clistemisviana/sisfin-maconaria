-- Carimbo de envio de comprovante por e-mail nas Entradas da Loja.
-- Guarda a data/hora do ultimo envio bem-sucedido por e-mail (reenvio sobrescreve).
-- Nao afeta o carimbo de impressao (impresso_em), que continua separado.

ALTER TABLE entradas_loja
  ADD COLUMN IF NOT EXISTS email_enviado_em timestamptz;
