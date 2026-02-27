"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import TextReveal from "@/components/ui/text-reveal";
import SecurityBadges from "@/components/SecurityBadges";
import SupplementDisclaimer from "@/components/SupplementDisclaimer";

interface FooterProps {
  className?: string;
}

function Footer({ className = "" }: FooterProps) {
  return (
    <footer
      className={`bg-brand-softblack text-brand-offwhite py-16 px-6 ${className}`}
    >
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.4 }}
        className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12"
      >
        <div>
          <h4 className="text-[10px] uppercase tracking-[0.3em] mb-6 font-bold">
            Menu
          </h4>
          <ul className="space-y-4 text-xs font-light tracking-widest opacity-80">
            <li>
              <Link href="/" className="hover:opacity-100 transition">
                Produtos
              </Link>
            </li>
            <li>
              <Link href="/sobre" className="hover:opacity-100 transition">
                Sobre Nós
              </Link>
            </li>
            <li>
              <Link href="/contato" className="hover:opacity-100 transition">
                Contato
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="text-[10px] uppercase tracking-[0.3em] mb-6 font-bold">
            Ajuda
          </h4>
          <ul className="space-y-4 text-xs font-light tracking-widest opacity-80">
            <li>
              <Link href="/trocas" className="hover:opacity-100 transition">
                Envios e Devoluções
              </Link>
            </li>
            <li>
              <Link href="/contato" className="hover:opacity-100 transition">
                Central de Atendimento
              </Link>
            </li>
            <li>
              <Link href="/checkout" className="hover:opacity-100 transition">
                Cupom SOUVIOS — 10% na 1ª compra
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="text-[10px] uppercase tracking-[0.3em] mb-6 font-bold">
            Newsletter
          </h4>
          <p className="text-xs font-light tracking-widest mb-4 opacity-80">
            Subscreve para receber novidades.
          </p>
          <input
            type="email"
            placeholder="O TEU E-MAIL"
            className="bg-transparent border-b border-brand-offwhite/30 w-full py-2 text-[10px] focus:outline-none focus:border-brand-offwhite transition"
          />
        </div>
      </motion.div>

      {/* Formas de Pagamento - Fade-in simples */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="max-w-7xl mx-auto mt-12 pt-8 border-t border-brand-offwhite/10"
      >
        <div className="text-center mb-6">
          <h4 className="text-[10px] uppercase tracking-[0.3em] mb-4 font-bold opacity-80">
            Formas de Pagamento
          </h4>
          <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6">
            {/* Visa */}
            <div
              className="flex items-center justify-center w-14 h-9 bg-white rounded-sm p-2 opacity-90 hover:opacity-100 transition-opacity"
              title="Visa"
            >
              <svg
                viewBox="0 0 36 24"
                className="w-full h-full"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M33.6 24H2.4A2.4 2.4 0 0 1 0 21.6V2.4A2.4 2.4 0 0 1 2.4 0h31.2A2.4 2.4 0 0 1 36 2.4v19.2a2.4 2.4 0 0 1-2.4 2.4zm-15.76-9.238l-.359 2.25a6.84 6.84 0 0 0 2.903.531h-.011a5.167 5.167 0 0 0 3.275-.933l-.017.011a3.085 3.085 0 0 0 1.258-2.485v-.015v.001c0-1.1-.736-2.014-2.187-2.72a7.653 7.653 0 0 1-1.132-.672l.023.016a.754.754 0 0 1-.343-.592v-.002a.736.736 0 0 1 .379-.6l.004-.002a1.954 1.954 0 0 1 1.108-.257h-.006h.08l.077-.001c.644 0 1.255.139 1.806.388l-.028-.011l.234.125l.359-2.171a6.239 6.239 0 0 0-2.277-.422h-.049h.003a5.067 5.067 0 0 0-3.157.932l.016-.011a2.922 2.922 0 0 0-1.237 2.386v.005c-.01 1.058.752 1.972 2.266 2.72c.4.175.745.389 1.054.646l-.007-.006a.835.835 0 0 1 .297.608v.004c0 .319-.19.593-.464.716l-.005.002c-.3.158-.656.25-1.034.25h-.046h.002h-.075c-.857 0-1.669-.19-2.397-.53l.035.015l-.343-.172zm10.125 1.141h3.315q.08.343.313 1.5H34L31.906 7.372h-2a1.334 1.334 0 0 0-1.357.835l-.003.009l-3.84 9.187h2.72l.546-1.499zM14.891 7.372l-1.626 10.031h2.594l1.625-10.031zM4.922 9.419l2.11 7.968h2.734l4.075-10.015h-2.746l-2.534 6.844l-.266-1.391l-.904-4.609a1.042 1.042 0 0 0-1.177-.844l.006-.001H2.033l-.031.203c3.224.819 5.342 2.586 6.296 5.25A5.74 5.74 0 0 0 6.972 10.8l-.001-.001a6.103 6.103 0 0 0-2.007-1.368l-.04-.015zm25.937 4.421h-2.16q.219-.578 1.032-2.8l.046-.141l.16-.406c.066-.166.11-.302.14-.406l.188.859l.593 2.89z"
                  fill="#1434CB"
                />
              </svg>
            </div>
            {/* Mastercard */}
            <div
              className="flex items-center justify-center w-14 h-9 bg-white rounded-sm p-2 opacity-90 hover:opacity-100 transition-opacity"
              title="Mastercard"
            >
              <svg
                viewBox="0 0 256 199"
                className="w-full h-full"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M46.54 198.011V184.84c0-5.05-3.074-8.342-8.343-8.342c-2.634 0-5.488.878-7.464 3.732c-1.536-2.415-3.731-3.732-7.024-3.732c-2.196 0-4.39.658-6.147 3.073v-2.634h-4.61v21.074h4.61v-11.635c0-3.731 1.976-5.488 5.05-5.488c3.072 0 4.61 1.976 4.61 5.488v11.635h4.61v-11.635c0-3.731 2.194-5.488 5.048-5.488c3.074 0 4.61 1.976 4.61 5.488v11.635h5.05Zm68.271-21.074h-7.463v-6.366h-4.61v6.366h-4.171v4.17h4.17v9.66c0 4.83 1.976 7.683 7.245 7.683c1.976 0 4.17-.658 5.708-1.536l-1.318-3.952c-1.317.878-2.853 1.098-3.951 1.098c-2.195 0-3.073-1.317-3.073-3.513v-9.44h7.463v-4.17Zm39.076-.44c-2.634 0-4.39 1.318-5.488 3.074v-2.634h-4.61v21.074h4.61v-11.854c0-3.512 1.536-5.488 4.39-5.488c.878 0 1.976.22 2.854.439l1.317-4.39c-.878-.22-2.195-.22-3.073-.22Zm-59.052 2.196c-2.196-1.537-5.269-2.195-8.562-2.195c-5.268 0-8.78 2.634-8.78 6.805c0 3.513 2.634 5.488 7.244 6.147l2.195.22c2.415.438 3.732 1.097 3.732 2.195c0 1.536-1.756 2.634-4.83 2.634c-3.073 0-5.488-1.098-7.025-2.195l-2.195 3.512c2.415 1.756 5.708 2.634 9 2.634c6.147 0 9.66-2.853 9.66-6.805c0-3.732-2.854-5.708-7.245-6.366l-2.195-.22c-1.976-.22-3.512-.658-3.512-1.975c0-1.537 1.536-2.415 3.951-2.415c2.635 0 5.269 1.097 6.586 1.756l1.976-3.732Zm122.495-2.195c-2.635 0-4.391 1.317-5.489 3.073v-2.634h-4.61v21.074h4.61v-11.854c0-3.512 1.537-5.488 4.39-5.488c.879 0 1.977.22 2.855.439l1.317-4.39c-.878-.22-2.195-.22-3.073-.22Zm-58.833 10.976c0 6.366 4.39 10.976 11.196 10.976c3.073 0 5.268-.658 7.463-2.414l-2.195-3.732c-1.756 1.317-3.512 1.975-5.488 1.975c-3.732 0-6.366-2.634-6.366-6.805c0-3.951 2.634-6.586 6.366-6.805c1.976 0 3.732.658 5.488 1.976l2.195-3.732c-2.195-1.757-4.39-2.415-7.463-2.415c-6.806 0-11.196 4.61-11.196 10.976Zm42.588 0v-10.537h-4.61v2.634c-1.537-1.975-3.732-3.073-6.586-3.073c-5.927 0-10.537 4.61-10.537 10.976c0 6.366 4.61 10.976 10.537 10.976c3.073 0 5.269-1.097 6.586-3.073v2.634h4.61v-10.537Zm-16.904 0c0-3.732 2.415-6.805 6.366-6.805c3.732 0 6.367 2.854 6.367 6.805c0 3.732-2.635 6.805-6.367 6.805c-3.951-.22-6.366-3.073-6.366-6.805Zm-55.1-10.976c-6.147 0-10.538 4.39-10.538 10.976c0 6.586 4.39 10.976 10.757 10.976c3.073 0 6.147-.878 8.562-2.853l-2.196-3.293c-1.756 1.317-3.951 2.195-6.146 2.195c-2.854 0-5.708-1.317-6.367-5.05h15.587v-1.755c.22-6.806-3.732-11.196-9.66-11.196Zm0 3.951c2.853 0 4.83 1.757 5.268 5.05h-10.976c.439-2.854 2.415-5.05 5.708-5.05Zm114.372 7.025v-18.879h-4.61v10.976c-1.537-1.975-3.732-3.073-6.586-3.073c-5.927 0-10.537 4.61-10.537 10.976c0 6.366 4.61 10.976 10.537 10.976c3.074 0 5.269-1.097 6.586-3.073v2.634h4.61v-10.537Zm-16.903 0c0-3.732 2.414-6.805 6.366-6.805c3.732 0 6.366 2.854 6.366 6.805c0 3.732-2.634 6.805-6.366 6.805c-3.952-.22-6.366-3.073-6.366-6.805Zm-154.107 0v-10.537h-4.61v2.634c-1.537-1.975-3.732-3.073-6.586-3.073c-5.927 0-10.537 4.61-10.537 10.976c0 6.366 4.61 10.976 10.537 10.976c3.074 0 5.269-1.097 6.586-3.073v2.634h4.61v-10.537Zm-17.123 0c0-3.732 2.415-6.805 6.366-6.805c3.732 0 6.367 2.854 6.367 6.805c0 3.732-2.635 6.805-6.367 6.805c-3.951-.22-6.366-3.073-6.366-6.805Z"
                  fill="#000000"
                />
                <path fill="#FF5F00" d="M93.298 16.903h69.15v124.251h-69.15z" />
                <path
                  fill="#EB001B"
                  d="M97.689 79.029c0-25.245 11.854-47.637 30.074-62.126C114.373 6.366 97.47 0 79.03 0C35.343 0 0 35.343 0 79.029c0 43.685 35.343 79.029 79.029 79.029c18.44 0 35.343-6.366 48.734-16.904c-18.22-14.269-30.074-36.88-30.074-62.125Z"
                />
                <path
                  fill="#F79E1B"
                  d="M255.746 79.029c0 43.685-35.343 79.029-79.029 79.029c-18.44 0-35.343-6.366-48.734-16.904c18.44-14.488 30.075-36.88 30.075-62.125c0-25.245-11.855-47.637-30.075-62.126C141.373 6.366 158.277 0 176.717 0c43.686 0 79.03 35.563 79.03 79.029Z"
                />
              </svg>
            </div>
            {/* Elo */}
            <div
              className="flex items-center justify-center w-14 h-9 bg-white rounded-sm p-2 opacity-90 hover:opacity-100 transition-opacity"
              title="Elo"
            >
              <svg
                viewBox="0 0 512 197"
                className="w-full h-full"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fill="#FC0"
                  d="M79.817 43.344A57.633 57.633 0 0 1 98.12 40.39c27.918 0 51.227 19.83 56.566 46.188l39.576-8.073C185.179 33.711 145.594 0 98.12 0a97.947 97.947 0 0 0-31.106 5.04l12.803 38.304Z"
                />
                <path
                  fill="#00A0DE"
                  d="m33.111 171.604l26.763-30.258c-11.946-10.584-19.484-26.03-19.484-43.239c0-17.196 7.527-32.635 19.466-43.206L33.091 24.64C12.802 42.614 0 68.869 0 98.107c0 29.256 12.807 55.519 33.111 73.497Z"
                />
                <path
                  fill="#EC3413"
                  d="M154.676 109.69c-5.362 26.345-28.646 46.137-56.556 46.137c-6.405 0-12.572-1.033-18.32-2.965l-12.821 38.32c9.779 3.264 20.25 5.032 31.141 5.032c47.428 0 87.009-33.655 96.126-78.408l-39.57-8.116Z"
                />
                <path
                  d="M228.87 142.622c-1.297-2.1-3.06-5.46-4.12-7.932c-6.267-14.55-6.567-29.607-1.274-44.061c5.819-15.852 16.935-27.988 31.298-34.167c18.057-7.771 38.028-6.239 55.334 4.03c10.994 6.307 18.788 16.045 24.706 29.813l.549 1.339l1.024 2.66c.165.429.327.846.489 1.246l-108.007 47.072Zm36.065-62.803c-12.823 5.511-19.433 17.54-18.075 31.644l54.32-23.378c-9.341-10.979-21.499-14.617-36.245-8.266Zm64.014 64.904l-20.996-14.038l-.03.031l-1.125-.758c-3.24 5.26-8.299 9.52-14.68 12.287c-12.142 5.28-23.394 3.923-31.474-3.164l-.743 1.13c-.008-.013-.01-.023-.024-.023l-13.78 20.617a58.958 58.958 0 0 0 10.952 6c15.223 6.323 30.798 6.03 46.142-.643c11.099-4.81 19.807-12.144 25.758-21.44Zm45.678-118.624v114.62l17.82 7.222l-10.126 23.627l-19.67-8.191c-4.416-1.911-7.42-4.838-9.696-8.14c-2.175-3.366-3.802-7.986-3.802-14.206V26.099h25.474Zm46.165 85.42c.01-9.76 4.32-18.513 11.14-24.462l-18.283-20.386c-12.4 10.96-20.21 26.976-20.224 44.82c-.02 17.85 7.778 33.882 20.165 44.871l18.262-20.406c-6.787-5.972-11.068-14.699-11.06-24.437Zm32.484 32.533c-3.6-.01-7.067-.605-10.3-1.681l-8.731 25.96a59.903 59.903 0 0 0 19.002 3.106c28.949.028 53.121-20.512 58.722-47.817l-26.837-5.48c-3.052 14.8-16.157 25.922-31.856 25.912Zm.08-92.389a59.768 59.768 0 0 0-18.985 3.056l8.655 25.984a32.824 32.824 0 0 1 10.304-1.662c15.736.015 28.85 11.203 31.83 26.045L512 99.642c-5.524-27.345-29.673-47.961-58.645-47.979Z"
                  fill="#000000"
                />
              </svg>
            </div>
            {/* American Express */}
            <div
              className="flex items-center justify-center w-14 h-9 bg-white rounded-sm p-2 opacity-90 hover:opacity-100 transition-opacity"
              title="American Express"
            >
              <svg
                viewBox="0 0 32 32"
                className="w-full h-full"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M21.355 19.172c0-.427-.183-.661-.459-.828c-.281-.161-.62-.183-1.084-.183h-2.057v3.76h.901v-1.369h.964c.317 0 .516.032.635.167c.161.172.141.505.141.735v.464h.875v-.74c0-.333-.02-.5-.14-.688a1.048 1.048 0 0 0-.443-.312l.025-.011c.245-.093.641-.396.641-.995zm-1.162.541l-.037-.005c-.12.073-.26.079-.443.079h-1.077v-.839h1.099c.161 0 .317 0 .443.068a.352.352 0 0 1 .197.339c0 .161-.063.285-.177.359zm6.87 1.402h-1.729v.803h1.74c.9 0 1.4-.371 1.4-1.177c0-.376-.088-.6-.249-.776c-.203-.177-.527-.261-.973-.276l-.501-.021c-.14 0-.239 0-.343-.041a.284.284 0 0 1-.199-.281c0-.12.021-.219.12-.276a.672.672 0 0 1 .365-.084h1.635v-.801h-1.797c-.937 0-1.276.583-1.276 1.12c0 1.203 1.032 1.14 1.876 1.161c.135 0 .239.02.296.077c.063.043.109.141.109.24c0 .104-.047.203-.104.24c-.077.072-.197.093-.369.093zM0 0v13.464l1.079-2.505h2.333l.301.62v-.62h2.724l.599 1.359l.584-1.348h8.672c.391 0 .744.077 1.005.317v-.308h2.385v.308c.405-.229.911-.308 1.489-.308h3.473l.324.62v-.62h2.557l.337.62v-.625h2.48v5.267h-2.516l-.479-.803v.781h-3.141l-.339-.839h-.781l-.359.817h-1.615c-.641 0-1.12-.135-1.443-.317v.317h-3.855v-1.176c0-.161-.036-.161-.135-.183h-.141v1.38H8.085v-.635l-.281.635H6.252l-.271-.635v.619H2.976l-.339-.833h-.776l-.337.833H-.003v15.797H31.71V22.52c-.359.181-.817.239-1.297.239h-2.296v-.339c-.281.219-.76.339-1.219.339h-7.287v-1.197c0-.161-.027-.161-.161-.161h-.099v1.364H16.95v-1.421c-.396.183-.86.197-1.24.183h-.281v1.219h-2.905l-.724-.824l-.761.803H6.32v-5.24h4.813l.692.803l.74-.803h3.213c.375 0 .984.043 1.255.303v-.323h2.901c.271 0 .86.063 1.208.301v-.317h4.349v.317c.219-.219.683-.317 1.073-.317h2.52v.317c.261-.197.62-.317 1.12-.317h1.568V.001zm28.208 19.937c.005.011.005.021.011.027c.016.009.036.009.047.025l-.057-.047zm3.563-2.494h.089v.74h-.089zm.046 2.598v-.011c-.036-.031-.057-.061-.099-.093c-.197-.203-.521-.287-1.016-.297l-.484-.015c-.156 0-.255-.011-.359-.041a.285.285 0 0 1-.199-.281c0-.12.041-.215.12-.272c.099-.057.197-.067.359-.067h1.631v-.781h-1.708c-.923 0-1.281.583-1.281 1.12c0 1.197 1.041 1.14 1.88 1.161c.141 0 .24.015.297.077c.063.043.104.141.104.24a.31.31 0 0 1-.12.24c-.063.072-.183.093-.359.093h-1.72v.807h1.715c.561 0 .979-.156 1.203-.479h.036c.12-.183.183-.401.183-.697c0-.324-.063-.521-.183-.704zm-7.02-1.098v-.776h-2.98v3.776h2.98v-.781h-2.095v-.755h2.043v-.781h-2.043v-.677zm-6.781-7.23h.911v3.756h-.911zm-.516 1.011l-.011.011c0-.423-.172-.667-.453-.833c-.287-.167-.624-.183-1.077-.183h-2.052v3.76h.9v-1.38h.959c.317 0 .521.041.651.161c.163.183.141.505.141.729v.475h.901v-.735c0-.333-.021-.5-.147-.693a1.085 1.085 0 0 0-.437-.312a1.06 1.06 0 0 0 .631-1zm-1.14.527h-.016c-.125.072-.261.077-.443.077h-1.099v-.833h1.099c.161 0 .317.005.437.068c.12.052.203.172.203.333s-.063.292-.181.355zm4.869-.756h.839v-.797h-.86c-.615 0-1.068.141-1.359.439c-.38.4-.48.921-.48 1.484c0 .683.161 1.109.48 1.427c.307.317.859.417 1.291.417h1.043l.339-.839h1.853l.349.839h1.812v-2.813l1.699 2.813h1.271v-3.751h-.917v2.62l-1.572-2.615h-1.36v3.479l-1.511-3.541h-1.339l-1.255 2.964h-.401c-.233 0-.484-.041-.624-.183c-.167-.197-.245-.479-.245-.88c0-.38.104-.683.255-.839c.177-.183.365-.224.688-.224zm2.224-.14l.615 1.489v.005h-1.24zm-20.281 2.27l.339.839h1.823v-2.937l1.297 2.937h.776l1.296-2.937l.021 2.937h.921v-3.745H8.156l-1.073 2.536l-1.171-2.541H4.459v3.552l-1.521-3.552H1.61L.017 15.465h.957l.344-.833h1.855zm-.917-2.27l.615 1.489l-.005.005H1.646zm13.552 5.806h-2.853l-1.136 1.229l-1.099-1.229H7.131v3.76h3.536l1.14-1.244l1.1 1.24h1.733v-1.251h1.12c.797 0 1.557-.219 1.557-1.26l-.005-.005c0-1.041-.796-1.24-1.505-1.24zm-5.578 2.975H8.026v-.745h1.957v-.765H8.026v-.677h2.239l.98 1.093l-1.021 1.099zm3.52.443l-1.375-1.532l1.375-1.473zm2.068-1.678H14.64v-.959h1.177c.323 0 .563.131.563.459s-.197.5-.563.5zm-2.525-7.406v-.781h-2.985v3.756h2.985v-.776h-2.095v-.751h2.037v-.771h-2.037v-.677z"
                  fill="#006FCF"
                />
              </svg>
            </div>
            {/* PIX */}
            <div
              className="flex items-center justify-center w-14 h-9 bg-white rounded-sm p-2 opacity-90 hover:opacity-100 transition-opacity"
              title="PIX"
            >
              <svg
                viewBox="0 0 512 512"
                className="w-full h-full"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M242.4 292.5c5.4-5.4 14.7-5.4 20.1 0l77 77c14.2 14.2 33.1 22 53.1 22h15.1l-97.1 97.1c-30.3 29.5-79.5 29.5-109.8 0l-97.5-97.4h9.3c20 0 38.9-7.8 53.1-22zm20.1-73.6c-6.4 5.5-14.6 5.6-20.1 0l-76.7-76.7c-14.2-15.1-33.1-22-53.1-22h-9.3l97.4-97.44c30.4-30.346 79.6-30.346 109.9 0l97.2 97.14h-15.2c-20 0-38.9 7.8-53.1 22zm-149.9-76.2c13.8 0 26.5 5.6 37.1 15.4l76.7 76.7c7.2 6.3 16.6 10.8 26.1 10.8c9.4 0 18.8-4.5 26-10.8l77-77c9.8-9.7 23.3-15.3 37.1-15.3h37.7l58.3 58.3c30.3 30.3 30.3 79.5 0 109.8l-58.3 58.3h-37.7c-13.8 0-27.3-5.6-37.1-15.4l-77-77c-13.9-13.9-38.2-13.9-52.1.1l-76.7 76.6c-10.6 9.8-23.3 15.4-37.1 15.4H80.78l-58.02-58c-30.346-30.3-30.346-79.5 0-109.8l58.02-58.1z"
                  fill="#32BCAD"
                />
              </svg>
            </div>
            {/* Boleto */}
            <div
              className="flex items-center justify-center px-4 h-9 bg-white rounded-sm opacity-90 hover:opacity-100 transition-opacity"
              title="Boleto Bancário"
            >
              <span className="text-[9px] font-bold text-brand-softblack tracking-wider uppercase">
                Boleto
              </span>
            </div>
          </div>
        </div>

        {/* Selos de Segurança */}
        <div className="mt-8 pt-6 border-t border-brand-offwhite/10">
          <h4 className="text-[10px] uppercase tracking-[0.3em] mb-4 font-bold opacity-80 text-center">
            Selos de Segurança
          </h4>
          <SecurityBadges variant="horizontal" theme="dark" />
          <SupplementDisclaimer variant="compact" theme="dark" className="mt-4 text-center" />
        </div>
      </motion.div>

      {/* Links Legais - Fade-in simples */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.4, delay: 0.15 }}
        className="max-w-7xl mx-auto mt-8 pt-8 border-t border-brand-offwhite/10"
      >
        <div className="flex flex-wrap justify-center gap-6 text-[10px] font-light tracking-wider opacity-70">
          <Link href="/termos" className="hover:opacity-100 transition">
            Termos de Uso
          </Link>
          <Link href="/privacidade" className="hover:opacity-100 transition">
            Política de Privacidade
          </Link>
          <Link href="/trocas" className="hover:opacity-100 transition">
            Envios e Devoluções
          </Link>
        </div>
      </motion.div>

      {/* Copyright com TextReveal como assinatura final */}
      <div className="max-w-7xl mx-auto mt-8 pt-6 border-t border-white/10">
        <TextReveal
          text="© 2026 VIOS LABS. Todos os direitos reservados."
          el="p"
          className="text-[10px] text-white/40 text-center font-light"
          delay={0.2}
          duration={0.6}
        />
      </div>

      {/* Dados Legais Obrigatórios - Pagar.me - Fade-in simples */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="max-w-7xl mx-auto mt-6 pt-6 border-t border-white/10 py-6"
      >
        {/* Desktop: Linha única com separadores */}
        <div className="hidden md:block">
          <div className="text-[10px] font-mono text-white/40 text-center leading-relaxed">
            <span>Isadora Matos Ferreira LTDA</span>
            <span className="mx-2">•</span>
            <span>CNPJ: 62.463.131/0001-62</span>
            <span className="mx-2">•</span>
            <span>
              Rua Cassiano Ricardo, 441 - Nova Franca, Franca - SP, CEP
              14409-214
            </span>
            <span className="mx-2">•</span>
            <span>atendimento@vioslabs.com.br</span>
            <span className="mx-2">|</span>
            <span>(11) 95213-6713</span>
          </div>
        </div>

        {/* Mobile: Linhas quebradas e centralizadas */}
        <div className="md:hidden">
          <div className="text-[10px] font-mono text-white/40 text-center space-y-2 leading-relaxed">
            <p>Isadora Matos Ferreira LTDA</p>
            <p>CNPJ: 62.463.131/0001-62</p>
            <p>
              Rua Cassiano Ricardo, 441 - Nova Franca, Franca - SP, CEP
              14409-214
            </p>
            <p>
              <span>atendimento@vioslabs.com.br</span>
              <span className="mx-2">|</span>
              <span>(11) 95213-6713</span>
            </p>
          </div>
        </div>
      </motion.div>
    </footer>
  );
}

// Memoizar Footer pois raramente muda
export default memo(Footer);
