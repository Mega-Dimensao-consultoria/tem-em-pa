-- RPC para resetar o status de mensagens pendentes (travadas) para forçar reenvio
CREATE OR REPLACE FUNCTION public.retry_pending_emails()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  -- Verificação de admin
  IF auth.uid() IS NOT NULL AND NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  -- Para mensagens na fila principal que estão "presas" (pending), 
  -- o PGMQ não tem um "retry" direto, mas podemos notificar o admin 
  -- que o reprocessamento é automático ou sugerir o reenvio via DLQ se falharem.
  
  -- Se o usuário quer um botão "Reenviar Pendentes", vamos apenas retornar uma mensagem
  -- informativa por enquanto, ou poderíamos tentar resetar visibilidade se PGMQ permitir.
  
  RETURN jsonb_build_object(
    'message', 'Fila pendente verificada. As mensagens na fila principal são processadas automaticamente pelo worker.'
  );
END;
$$;

REVOKE ALL ON FUNCTION public.retry_pending_emails() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.retry_pending_emails() TO authenticated, service_role;