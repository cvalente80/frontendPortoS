import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export type ProductInfo = {
  nome: string;
  descricao: string;
  imagem: string;
  to: string;
};

export default function ProductCard({ nome, descricao, imagem, to }: ProductInfo) {
  const { t } = useTranslation('home');
  return (
    <Link
      to={to}
      className="group bg-white rounded-xl shadow-sm hover:shadow-lg focus-visible:ring-2 focus-visible:ring-blue-500 transition-all duration-200 block overflow-hidden hover:-translate-y-0.5"
    >
      <div className="p-6 flex flex-col items-center">
  <img src={imagem} alt={nome} loading="lazy" className="w-24 h-24 object-cover rounded-full mb-4 border-4 border-blue-200" />
        <h4 className="text-lg font-semibold text-blue-700 text-center">{nome}</h4>
        <p className="text-gray-700 text-sm text-center mt-1">{descricao}</p>
        <span className="mt-3 text-blue-700 underline underline-offset-4 group-hover:text-blue-900">{t('ctaMore')}</span>
      </div>
    </Link>
  );
}
