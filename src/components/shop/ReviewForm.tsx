"use client";

import { useState, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { submitReview } from "@/actions/review-action";

interface ReviewFormProps {
  productId: string;
  onSuccess?: () => void;
}

function StarInput({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex gap-1" role="group" aria-label="Avaliação">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") onChange(star);
          }}
          className="p-0.5 focus:outline-none focus:ring-2 focus:ring-brand-gold/50 rounded"
          aria-label={`${star} estrela${star > 1 ? "s" : ""}`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill={star <= value ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth={1}
            className={`w-6 h-6 transition-colors ${
              star <= value ? "text-brand-gold" : "text-gray-300"
            }`}
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        </button>
      ))}
    </div>
  );
}

function ImageInput({
  preview,
  error,
  onFileChange,
  onClear,
}: {
  preview: string | null;
  error: string | null;
  onFileChange: (file: File) => void;
  onClear: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) onFileChange(file);
    },
    [onFileChange],
  );

  return (
    <div>
      <p className="block text-xs uppercase tracking-wider text-brand-softblack/70 font-light mb-3">
        Foto do Produto / resultado{" "}
        <span className="normal-case tracking-normal text-brand-softblack/40">
          (opcional)
        </span>
      </p>

      <div className="flex flex-wrap items-start gap-3">
        {preview ? (
          <div className="relative shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt="Preview da imagem selecionada"
              className="w-20 h-20 object-cover rounded-sm border border-gray-200"
            />
            <button
              type="button"
              onClick={onClear}
              aria-label="Remover imagem"
              className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-white border border-gray-300 rounded-full flex items-center justify-center text-brand-softblack/70 hover:text-red-500 hover:border-red-300 transition-colors text-xs font-medium"
            >
              ×
            </button>
          </div>
        ) : null}

        <label className="cursor-pointer">
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            onChange={handleChange}
          />
          <span
            className={`inline-flex items-center gap-2 px-4 py-3 border rounded-sm text-xs font-light transition-colors ${
              preview
                ? "border-gray-200 text-brand-softblack/50 hover:border-brand-gold hover:text-brand-softblack"
                : "border-dashed border-gray-300 text-brand-softblack/60 hover:border-brand-gold hover:text-brand-softblack"
            }`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              className="w-4 h-4"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3 3.75h13.5A1.5 1.5 0 0118 5.25v9A1.5 1.5 0 0116.5 15.75H3A1.5 1.5 0 011.5 14.25v-9A1.5 1.5 0 013 3.75z"
              />
            </svg>
            {preview ? "Alterar foto" : "Adicionar foto"}
          </span>
        </label>
      </div>

      {error ? (
        <p className="text-[11px] text-red-500 mt-2">{error}</p>
      ) : (
        <p className="text-[10px] text-brand-softblack/40 mt-2">
          Máx. 3 MB · JPG, PNG ou WEBP
        </p>
      )}
    </div>
  );
}

const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 3 * 1024 * 1024;

export default function ReviewForm({ productId, onSuccess }: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [text, setText] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [authorEmail, setAuthorEmail] = useState("");

  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleFileChange = useCallback((file: File) => {
    setImageError(null);
    if (!ALLOWED_MIME.includes(file.type)) {
      setImageError("Formato inválido. Use JPG, PNG ou WEBP.");
      return;
    }
    if (file.size > MAX_SIZE) {
      setImageError("Imagem muito grande. Máximo 3 MB.");
      return;
    }
    setPendingFile(file);
    setImagePreview(URL.createObjectURL(file));
  }, []);

  const clearImage = useCallback(() => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setPendingFile(null);
    setImagePreview(null);
    setImageError(null);
  }, [imagePreview]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setMessage(null);

      if (rating < 1) {
        setMessage({
          type: "error",
          text: "Selecione uma avaliação (1 a 5 estrelas).",
        });
        return;
      }

      setIsSubmitting(true);

      let uploadedImageUrl: string | null = null;

      if (pendingFile) {
        const formData = new FormData();
        formData.append("image", pendingFile);
        formData.append("product_id", productId);

        try {
          const res = await fetch("/api/reviews/upload", {
            method: "POST",
            body: formData,
          });
          if (!res.ok) {
            const data = (await res.json()) as { error?: string };
            setIsSubmitting(false);
            setMessage({
              type: "error",
              text: data.error ?? "Erro ao enviar a imagem. Tente novamente.",
            });
            return;
          }
          const data = (await res.json()) as { url?: string };
          uploadedImageUrl = data.url ?? null;
        } catch {
          setIsSubmitting(false);
          setMessage({
            type: "error",
            text: "Erro ao enviar a imagem. Verifique sua conexão.",
          });
          return;
        }
      }

      const result = await submitReview({
        product_id: productId,
        rating,
        text,
        author_name: authorName,
        author_email: authorEmail,
        image_url: uploadedImageUrl,
      });

      setIsSubmitting(false);

      if (result.success) {
        setMessage({ type: "success", text: result.message });
        setRating(0);
        setText("");
        setAuthorName("");
        setAuthorEmail("");
        clearImage();
        onSuccess?.();
      } else {
        setMessage({ type: "error", text: result.error });
      }
    },
    [
      productId,
      rating,
      text,
      authorName,
      authorEmail,
      pendingFile,
      clearImage,
      onSuccess,
    ],
  );

  return (
    <motion.form
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      onSubmit={handleSubmit}
      className="p-6 md:p-8 border border-gray-200 rounded-sm bg-brand-offwhite/30"
    >
      <h3 className="text-sm uppercase tracking-[0.2em] font-light text-brand-softblack mb-4">
        Envie sua avaliação
      </h3>

      <div className="space-y-5">
        <div>
          <label
            htmlFor="review-rating"
            className="block text-xs uppercase tracking-wider text-brand-softblack/70 font-light mb-2"
          >
            Avaliação
          </label>
          <StarInput value={rating} onChange={setRating} />
        </div>

        <div>
          <label
            htmlFor="review-text"
            className="block text-xs uppercase tracking-wider text-brand-softblack/70 font-light mb-2"
          >
            Sua avaliação
          </label>
          <textarea
            id="review-text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Conte sua experiência com o produto..."
            rows={4}
            maxLength={1000}
            className="w-full px-4 py-3 border border-gray-200 rounded-sm text-sm font-light text-brand-softblack placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-brand-gold focus:border-brand-gold transition-colors"
            required
          />
          <p className="text-[10px] text-brand-softblack/50 mt-1">
            {text.length}/1000 caracteres
          </p>
        </div>

        <ImageInput
          preview={imagePreview}
          error={imageError}
          onFileChange={handleFileChange}
          onClear={clearImage}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="review-name"
              className="block text-xs uppercase tracking-wider text-brand-softblack/70 font-light mb-2"
            >
              Nome
            </label>
            <input
              id="review-name"
              type="text"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              placeholder="Seu nome"
              maxLength={100}
              className="w-full px-4 py-3 border border-gray-200 rounded-sm text-sm font-light text-brand-softblack placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-brand-gold focus:border-brand-gold transition-colors"
              required
            />
          </div>
          <div>
            <label
              htmlFor="review-email"
              className="block text-xs uppercase tracking-wider text-brand-softblack/70 font-light mb-2"
            >
              E-mail
            </label>
            <input
              id="review-email"
              type="email"
              value={authorEmail}
              onChange={(e) => setAuthorEmail(e.target.value)}
              placeholder="seu@email.com"
              className="w-full px-4 py-3 border border-gray-200 rounded-sm text-sm font-light text-brand-softblack placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-brand-gold focus:border-brand-gold transition-colors"
              required
            />
          </div>
        </div>

        {message && (
          <p
            className={`text-sm font-light ${
              message.type === "success" ? "text-brand-green" : "text-red-600"
            }`}
          >
            {message.text}
          </p>
        )}

        <button
          type="submit"
          disabled={isSubmitting || !!imageError}
          className="w-full border border-brand-green bg-brand-green text-brand-offwhite px-6 py-3 uppercase tracking-[0.2em] text-xs font-medium hover:bg-brand-softblack hover:border-brand-softblack transition-colors duration-300 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isSubmitting
            ? pendingFile && !message
              ? "Enviando imagem..."
              : "Enviando..."
            : "Enviar avaliação"}
        </button>
      </div>

      <p className="text-[10px] text-brand-softblack/50 mt-4">
        Sua avaliação será publicada após moderação.
      </p>
    </motion.form>
  );
}
