import React from 'react';
import { Link } from 'react-router-dom';
import type { ProductInfo } from './ProductCard';
import { useTranslation } from 'react-i18next';

export default function ProductCardMobile({ nome, descricao, imagem, to }: ProductInfo) {
  const { t } = useTranslation('home');
  return (
    <Link
      to={to}
      className="group bg-white rounded-2xl shadow-sm hover:shadow-lg focus-visible:ring-2 focus-visible:ring-blue-500 transition-all duration-200 block overflow-hidden hover:-translate-y-0.5"
    >
      <div className="p-4 flex items-center gap-4">
  <img src={imagem} alt={nome} loading="lazy" className="w-16 h-16 object-cover rounded-full border-4 border-blue-200 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <h4 className="text-base font-semibold text-blue-700 truncate">{nome}</h4>
          <p className="text-gray-700 text-sm line-clamp-2">{descricao}</p>
          <span className="inline-block mt-2 text-blue-700 underline underline-offset-4 group-hover:text-blue-900">{t('ctaOpen')}</span>
        </div>
      </div>
    </Link>
  );
}
