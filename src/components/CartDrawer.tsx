"use client";
import { useEffect, useCallback, useState, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Lock, X } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/utils/format";
import ShippingMeter from "@/components/cart/ShippingMeter";
import { useAuth } from "@/hooks/useAuth";
import PaymentMethodSelector, {
  type PaymentMethod,
  type InstallmentOption,
} from "@/components/checkout/PaymentMethodSelector";
import CheckoutForm, {
  type CheckoutFormData,
} from "@/components/checkout/CheckoutForm";
import CheckoutPaymentStep from "@/components/checkout/CheckoutPaymentStep";
import type { CheckoutPaymentPayload } from "@/types/checkout";

function CartDrawer() {
  const {
    cart,
    isOpen,
    setIsOpen,
    removeFromCart,
    updateQuantity,
    totalPrice,
  } = useCart();
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const { user } = useAuth(); // Obter usuário atual (pode ser null para guests)

  // Estados para seleção de método de pagamento
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(
    null,
  );
  const [installmentOption, setInstallmentOption] =
    useState<InstallmentOption | null>(null);

  // Estado para controlar exibição do formulário de checkout
  const [showCheckoutForm, setShowCheckoutForm] = useState(false);
  // Step de pagamento embed (Pagar.me — PIX e cartão tokenizecard) — checkout a cara da VIOS
  const [checkoutStep, setCheckoutStep] = useState<"form" | "payment">("form");
  const [paymentPayload, setPaymentPayload] =
    useState<CheckoutPaymentPayload | null>(null);

  // Frete: mesma regra da API (evitar duplicar constante em vários arquivos)
  const FREE_SHIPPING_THRESHOLD = 289.9;
  const FIXED_SHIPPING_REAIS = 25;
  const PIX_DISCOUNT_PERCENT = 0.05; // 5% off no PIX (sobre o subtotal)
  const isFreeShipping = totalPrice >= FREE_SHIPPING_THRESHOLD;
  const shippingAmount = isFreeShipping ? 0 : FIXED_SHIPPING_REAIS;
  const totalWithShipping = totalPrice + shippingAmount;
  const pixDiscount =
    paymentMethod === "pix" ? totalPrice * PIX_DISCOUNT_PERCENT : 0;
  const totalWithShippingFinal = totalWithShipping - pixDiscount;

  // Resetar estados de loading quando o componente é montado novamente ou quando o usuário volta
  useEffect(() => {
    // Resetar ao montar (caso o usuário tenha voltado)
    setIsCheckingOut(false);

    // Verificar se voltou de uma ação de processamento (mais confiável que popstate)
    const handlePageShow = (event: PageTransitionEvent) => {
      // Se a página foi carregada do cache (botão voltar), resetar estados
      if (
        event.persisted ||
        (performance.navigation && performance.navigation.type === 2)
      ) {
        setIsCheckingOut(false);
        // Forçar reload se detectar que voltou de uma ação de processamento
        // Isso garante que o estado seja completamente resetado
        const wasProcessing = sessionStorage.getItem("checkout_processing");
        if (wasProcessing === "true") {
          sessionStorage.removeItem("checkout_processing");
          // Pequeno delay para evitar loop infinito
          setTimeout(() => {
            window.location.reload();
          }, 100);
        }
      }
    };

    // Resetar quando o usuário usa o botão voltar do navegador
    const handlePopState = () => {
      setIsCheckingOut(false);
      // Verificar se estava processando
      const wasProcessing = sessionStorage.getItem("checkout_processing");
      if (wasProcessing === "true") {
        sessionStorage.removeItem("checkout_processing");
        // Forçar reload para garantir reset completo
        setTimeout(() => {
          window.location.reload();
        }, 100);
      }
    };

    window.addEventListener("pageshow", handlePageShow);
    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("pageshow", handlePageShow);
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  // Prevenir scroll quando carrinho está aberto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const handleQuantityChange = useCallback(
    (productId: string, newQuantity: number) => {
      if (newQuantity < 1) {
        removeFromCart(productId);
      } else {
        updateQuantity(productId, newQuantity);
      }
    },
    [removeFromCart, updateQuantity],
  );

  /**
   * Handler inicial do checkout — sempre mostra formulário (dados + entrega)
   * Depois renderiza pagamento embed (Pagar.me — PIX ou cartão) — a cara da VIOS
   */
  const handleCheckout = () => {
    if (!paymentMethod) {
      alert("Por favor, selecione uma forma de pagamento.");
      return;
    }
    if (paymentMethod === "card" && !installmentOption) {
      alert("Por favor, selecione o número de parcelas.");
      return;
    }
    setCheckoutStep("form");
    setPaymentPayload(null);
    setShowCheckoutForm(true);
  };

  /**
   * Processa o checkout após coletar dados do formulário — apenas Pagar.me.
   * PIX: chama API e exibe step com QR Code. Cartão: exibe step com formulário de cartão (tokenizecard) e chama API ao enviar token.
   */
  const processCheckout = async (checkoutFormData?: CheckoutFormData) => {
    if (!checkoutFormData) return;
    try {
      setIsCheckingOut(true);
      sessionStorage.setItem("checkout_processing", "true");

      const items = cart.map((item) => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        image: item.image,
        kitProducts: item.kitProducts,
        isKit: item.isKit,
      }));

      const userId = user?.id || null;
      const opt = installmentOption ?? "1x";

      if (paymentMethod === "pix") {
        const response = await fetch("/api/checkout/pagarme", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items,
            userId,
            paymentMethod: "pix",
            checkoutData: checkoutFormData,
          }),
        });
        const data = await response.json();
        if (!response.ok) {
          const msg = data.error || "Erro ao processar checkout";
          setIsCheckingOut(false);
          sessionStorage.removeItem("checkout_processing");
          alert(msg);
          return;
        }
        sessionStorage.removeItem("checkout_processing");
        setPaymentPayload({
          provider: "pagarme",
          orderId: data.orderId,
          paymentMethod: "pix",
          pix: data.pix ?? { qr_code: null, qr_code_url: null },
        });
        setCheckoutStep("payment");
        setShowCheckoutForm(false);
        setIsCheckingOut(false);
        return;
      }

      if (paymentMethod === "card") {
        sessionStorage.removeItem("checkout_processing");
        setPaymentPayload({
          provider: "pagarme",
          paymentMethod: "card",
          checkoutData: checkoutFormData,
          items,
          userId,
          installmentOption: opt,
        });
        setCheckoutStep("payment");
        setShowCheckoutForm(false);
        setIsCheckingOut(false);
      }
    } catch (error: unknown) {
      console.error("Erro no checkout:", error);
      setIsCheckingOut(false);
      sessionStorage.removeItem("checkout_processing");
      alert(
        "Erro ao conectar com o servidor. Verifique sua conexão e tente novamente.",
      );
    }
  };

  /**
   * Handler quando formulário de checkout é submetido
   */
  const handleCheckoutFormSubmit = (formData: CheckoutFormData) => {
    setShowCheckoutForm(false);
    processCheckout(formData);
  };

  const handlePaymentSuccess = (id: string) => {
    sessionStorage.removeItem("checkout_processing");
    window.location.href = `/checkout/success?order_id=${encodeURIComponent(id)}`;
  };

  const handlePaymentStepClose = () => {
    setCheckoutStep("form");
    setPaymentPayload(null);
    setShowCheckoutForm(false);
  };

  /**
   * Handler quando formulário de checkout é cancelado
   */
  const handleCheckoutFormCancel = () => {
    setShowCheckoutForm(false);
  };

  const handleCloseCart = useCallback(() => {
    setIsOpen(false);
  }, [setIsOpen]);

  return (
    <>
      {/* Checkout: formulário (dados) ou step de pagamento (Pagar.me) */}
      <AnimatePresence>
        {(showCheckoutForm || checkoutStep === "payment") && (
          <>
            {checkoutStep === "form" && (
              <CheckoutForm
                onSubmit={handleCheckoutFormSubmit}
                onCancel={handleCheckoutFormCancel}
                initialEmail={user?.email || undefined}
                isLoading={isCheckingOut}
                orderSummary={{
                  subtotal: totalPrice,
                  shipping: shippingAmount,
                  total: totalWithShippingFinal,
                  freeShipping: isFreeShipping,
                  ...(pixDiscount > 0 && { discount: pixDiscount }),
                }}
                paymentSummary={
                  paymentMethod === "card" &&
                  (installmentOption === "2x" || installmentOption === "3x")
                    ? {
                        installments: installmentOption === "2x" ? 2 : 3,
                        total: totalWithShipping,
                        installmentAmount:
                          Math.round(
                            (totalWithShipping /
                              (installmentOption === "2x" ? 2 : 3)) *
                              100,
                          ) / 100,
                      }
                    : undefined
                }
              />
            )}
            {checkoutStep === "payment" && paymentPayload && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-80 flex items-center justify-center p-4"
                onClick={handlePaymentStepClose}
              >
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="bg-white rounded-sm shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto relative p-8"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    onClick={handlePaymentStepClose}
                    className="absolute top-6 right-6 p-2 text-gray-400 hover:text-brand-softblack transition-colors"
                    aria-label="Fechar"
                  >
                    <X className="w-5 h-5" />
                  </button>
                  <h2 className="text-xl font-light uppercase tracking-widest text-brand-softblack mb-6">
                    Pagamento
                  </h2>
                  <CheckoutPaymentStep
                    payload={paymentPayload}
                    onSuccess={handlePaymentSuccess}
                    onError={(msg) => alert(msg)}
                  />
                </motion.div>
              </motion.div>
            )}
          </>
        )}
      </AnimatePresence>

      {/* Carrinho */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop Escuro com Blur */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
              onClick={handleCloseCart}
              aria-hidden="true"
            />

            {/* Painel Lateral com Animação */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="fixed right-0 top-0 h-full w-full max-w-[400px] bg-white z-[70] shadow-2xl"
              role="dialog"
              aria-modal="true"
              aria-label="Carrinho de compras"
            >
              <div className="h-full flex flex-col">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-gray-200">
                  <h2 className="text-xl font-light uppercase tracking-widest text-brand-softblack">
                    O teu carrinho
                  </h2>
                  <button
                    onClick={handleCloseCart}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    aria-label="Fechar carrinho"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-6 h-6 text-brand-softblack"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>

                {/* Conteúdo do Carrinho */}
                <div className="flex-1 overflow-y-auto p-6">
                  {cart.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1}
                        stroke="currentColor"
                        className="w-16 h-16 text-gray-300 mb-4"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
                        />
                      </svg>
                      <p className="text-gray-500 font-light text-sm mb-2">
                        O teu carrinho está vazio.
                      </p>
                      <Link
                        href="/"
                        onClick={handleCloseCart}
                        className="text-brand-green text-[10px] uppercase tracking-wider hover:underline"
                      >
                        Continuar a comprar
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Shipping Meter - Incentivo de Frete Grátis */}
                      <ShippingMeter currentSubtotal={totalPrice} />

                      {cart.map((item) => {
                        const itemTotal = item.price * item.quantity;
                        return (
                          <div
                            key={item.id}
                            className="flex gap-4 pb-4 border-b border-gray-100 last:border-0"
                          >
                            {/* Imagem do Produto/Kit */}
                            <div
                              className={`relative w-20 h-24 flex-shrink-0 bg-gray-100 rounded-sm overflow-hidden ${!item.isKit ? "group" : ""}`}
                            >
                              {!item.isKit ? (
                                <Link
                                  href={`/produto/${item.id}`}
                                  onClick={handleCloseCart}
                                  className="block w-full h-full"
                                >
                                  <Image
                                    src={item.image}
                                    alt={item.name}
                                    fill
                                    sizes="80px"
                                    className="object-cover group-hover:scale-105 transition-transform"
                                    loading="lazy"
                                    quality={75}
                                  />
                                </Link>
                              ) : (
                                <>
                                  {item.image ? (
                                    <Image
                                      src={item.image}
                                      alt={item.name}
                                      fill
                                      sizes="80px"
                                      className="object-cover"
                                      loading="lazy"
                                      quality={75}
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-brand-offwhite to-brand-champagne/30">
                                      <span className="text-[8px] uppercase tracking-wider text-brand-gold font-light text-center px-2">
                                        {item.category}
                                      </span>
                                    </div>
                                  )}
                                </>
                              )}
                            </div>

                            {/* Informações do Produto/Kit */}
                            <div className="flex-1 min-w-0">
                              {!item.isKit ? (
                                <Link
                                  href={`/produto/${item.id}`}
                                  onClick={handleCloseCart}
                                  className="block"
                                >
                                  <h3 className="text-sm uppercase font-medium text-brand-softblack hover:text-brand-green transition-colors line-clamp-2">
                                    {item.name}
                                  </h3>
                                </Link>
                              ) : (
                                <h3 className="text-sm uppercase font-medium text-brand-gold line-clamp-2">
                                  {item.name}
                                </h3>
                              )}

                              <p className="text-xs text-gray-500 mt-1">
                                {formatPrice(item.price)}
                                {item.isKit && (
                                  <span className="ml-2 text-[10px] text-brand-green">
                                    Kit
                                  </span>
                                )}
                              </p>

                              {/* Controles de Quantidade */}
                              <div className="flex items-center gap-3 mt-3">
                                <div className="flex items-center border border-gray-300 rounded-sm">
                                  <button
                                    onClick={() =>
                                      handleQuantityChange(
                                        item.id,
                                        item.quantity - 1,
                                      )
                                    }
                                    className="px-2 py-1 hover:bg-gray-100 transition-colors text-brand-softblack"
                                    aria-label="Diminuir quantidade"
                                  >
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      strokeWidth={2}
                                      stroke="currentColor"
                                      className="w-4 h-4"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M19.5 12h-15"
                                      />
                                    </svg>
                                  </button>
                                  <span className="px-3 py-1 text-sm font-medium text-brand-softblack min-w-[2rem] text-center">
                                    {item.quantity}
                                  </span>
                                  <button
                                    onClick={() =>
                                      handleQuantityChange(
                                        item.id,
                                        item.quantity + 1,
                                      )
                                    }
                                    className="px-2 py-1 hover:bg-gray-100 transition-colors text-brand-softblack"
                                    aria-label="Aumentar quantidade"
                                  >
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      strokeWidth={2}
                                      stroke="currentColor"
                                      className="w-4 h-4"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M12 4.5v15m7.5-7.5h-15"
                                      />
                                    </svg>
                                  </button>
                                </div>

                                {/* Botão Remover */}
                                <button
                                  onClick={() => removeFromCart(item.id)}
                                  className="p-1 hover:bg-red-50 text-red-600 rounded transition-colors"
                                  aria-label="Remover item"
                                >
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    strokeWidth={1.5}
                                    stroke="currentColor"
                                    className="w-4 h-4"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                                    />
                                  </svg>
                                </button>
                              </div>

                              {/* Total do Item */}
                              <p className="text-sm font-semibold text-brand-softblack mt-2">
                                {formatPrice(itemTotal)}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Footer com Resumo e Botão */}
                {cart.length > 0 && (
                  <div className="border-t border-gray-200 p-6 bg-gray-50">
                    <div className="mb-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm uppercase tracking-wider text-gray-600">
                          Subtotal
                        </span>
                        <span className="text-lg font-semibold text-brand-softblack">
                          {formatPrice(totalPrice)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm uppercase tracking-wider text-gray-600">
                          Frete
                        </span>
                        <span className="text-sm font-medium text-brand-softblack">
                          {isFreeShipping ? (
                            <span className="text-brand-green">Grátis</span>
                          ) : (
                            formatPrice(shippingAmount)
                          )}
                        </span>
                      </div>
                      {pixDiscount > 0 && (
                        <div className="flex justify-between items-center mb-2 text-brand-green text-sm">
                          <span className="uppercase tracking-wider">
                            Desconto 5% (PIX)
                          </span>
                          <span>- {formatPrice(pixDiscount)}</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center mb-0 pt-1 border-t border-gray-200">
                        <span className="text-sm uppercase tracking-wider text-gray-600 font-medium">
                          Total
                        </span>
                        <span className="text-lg font-semibold text-brand-softblack">
                          {formatPrice(totalWithShippingFinal)}
                        </span>
                      </div>
                    </div>

                    {/* Seleção de Método de Pagamento - Sutil */}
                    <div className="mb-3 pb-3 border-b border-gray-100">
                      <PaymentMethodSelector
                        selectedMethod={paymentMethod}
                        installmentOption={installmentOption}
                        onMethodChange={setPaymentMethod}
                        onInstallmentChange={setInstallmentOption}
                        totalAmount={totalPrice}
                      />
                    </div>

                    <button
                      onClick={handleCheckout}
                      disabled={
                        isCheckingOut || cart.length === 0 || !paymentMethod
                      }
                      className="w-full bg-brand-green text-brand-offwhite py-4 uppercase tracking-widest text-[10px] text-center hover:bg-brand-green/90 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-h-[44px] active:opacity-70"
                      aria-label={
                        !paymentMethod
                          ? "Selecione uma forma de pagamento"
                          : "Finalizar compra"
                      }
                    >
                      {isCheckingOut ? (
                        <>
                          <svg
                            className="animate-spin h-4 w-4 text-brand-offwhite"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            />
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            />
                          </svg>
                          <span>Processando...</span>
                        </>
                      ) : (
                        <>
                          <Lock className="w-4 h-4" />
                          <span>Finalizar Compra</span>
                        </>
                      )}
                    </button>

                    <Link
                      href="/"
                      onClick={handleCloseCart}
                      className="block text-center text-[10px] uppercase tracking-wider text-brand-softblack/60 hover:text-brand-green transition-colors mt-3"
                    >
                      Continuar a comprar
                    </Link>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

// Memoizar componente inteiro
export default memo(CartDrawer);
