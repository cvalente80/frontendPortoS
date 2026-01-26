import React from "react";
import Seo from "../components/Seo";
import { Link, useParams } from "react-router-dom";
import ProductCard from "../components/ProductCard";
import ProductCardMobile from "../components/ProductCardMobile";
import HeroDesktop from "../components/HeroDesktop";
import HeroMobile from "../components/HeroMobile";
import { ResponsiveGate } from "../components/ResponsiveGate";
import { useTranslation } from "react-i18next";

function useHomeProducts() {
	const { t } = useTranslation('home');
	return [
		{
			nome: t('productsIndividuals.auto.name'),
			descricao: t('productsIndividuals.auto.desc'),
			imagem: `${import.meta.env.BASE_URL}imagens/nosso-produtos-car.jpg`,
			to: 'produto-auto',
		},
		{
			nome: t('productsIndividuals.life.name'),
			descricao: t('productsIndividuals.life.desc'),
			imagem: 'https://images.pexels.com/photos/1683975/pexels-photo-1683975.jpeg?auto=compress&w=400&q=60',
			to: 'produto-vida',
		},
		{
			nome: t('productsIndividuals.health.name'),
			descricao: t('productsIndividuals.health.desc'),
			imagem: `${import.meta.env.BASE_URL}health-insurance.svg`,
			to: 'produto-saude',
		},
		{
			nome: t('productsIndividuals.home.name'),
			descricao: t('productsIndividuals.home.desc'),
			imagem: 'https://images.unsplash.com/photo-1507089947368-19c1da9775ae?auto=format&fit=crop&w=400&q=80',
			to: 'produto-habitacao',
		},
	];
}

function useBusinessProducts() {
	const { t } = useTranslation('home');
	return [
		{
			nome: t('productsBusiness.fleet.name'),
			descricao: t('productsBusiness.fleet.desc'),
			imagem: 'https://images.pexels.com/photos/210019/pexels-photo-210019.jpeg?auto=compress&w=400&q=60',
			to: 'produto-frota',
		},
		{
			nome: t('productsBusiness.work.name'),
			descricao: t('productsBusiness.work.desc'),
			imagem: 'https://images.pexels.com/photos/3183197/pexels-photo-3183197.jpeg?auto=compress&w=400&q=60',
			to: 'produto-acidentes-trabalho',
		},
		{
			nome: t('productsBusiness.rcp.name'),
			descricao: t('productsBusiness.rcp.desc'),
			imagem: 'https://images.pexels.com/photos/1181671/pexels-photo-1181671.jpeg?auto=compress&w=400&q=60',
			to: 'produto-responsabilidade-civil-profissional',
		},
		{
			nome: t('productsBusiness.mreb.name'),
			descricao: t('productsBusiness.mreb.desc'),
			imagem: 'https://images.pexels.com/photos/323705/pexels-photo-323705.jpeg?auto=compress&w=400&q=60',
			to: 'produto-multirriscos-empresarial',
		},
		{
			nome: t('productsBusiness.condo.name'),
			descricao: t('productsBusiness.condo.desc'),
			imagem: 'https://images.pexels.com/photos/439391/pexels-photo-439391.jpeg?auto=compress&w=400&q=60',
			to: 'produto-condominio',
		},
	];
}


export default function Home() {
  const { t } = useTranslation('home');
  const { lang } = useParams();
  const base = lang === 'en' ? 'en' : 'pt';
  const produtos = useHomeProducts();
  const produtosEmp = useBusinessProducts();

	// Derivar marca pelo domínio para personalizar textos (Ansião, Sintra, etc.)
	const host = typeof window !== 'undefined' ? window.location.hostname.toLowerCase() : '';
	let brandName = 'Ansião Seguros';
	if (host.includes('aurelio')) brandName = 'Aurélio Seguros';
	else if (host.includes('sintraseg') || host.includes('sintra')) brandName = 'Sintra Seguros';
	else if (host.includes('pombalseg') || host.includes('pombal')) brandName = 'Pombal Seguros';
	else if (host.includes('povoaseg') || host.includes('povoa')) brandName = 'Póvoa Seguros';
	else if (host.includes('lisboaseg') || host.includes('lisboa')) brandName = 'Lisboa Seguros';
	else if (host.includes('portoseg') || host.includes('porto')) brandName = 'Porto Seguros';

	const rawBenefitsTitle = t('benefitsTitle');
	const benefitsTitle = rawBenefitsTitle
		.replace(/Ansião Seguros/g, brandName);
	return (
		<div className="min-h-screen bg-white flex flex-col relative">
			<Seo
				title={t('heroTitle')}
				image={`${import.meta.env.BASE_URL}logo-empresarial.svg`}
				canonicalPath={`/${base}`}
			/>
			{/* Hero responsivo */}
			<ResponsiveGate mobile={<HeroMobile />} desktop={<HeroDesktop />} />
			{/* Produtos em destaque */}
			<section className="py-16 px-6 bg-gray-50">
				<h2 className="text-3xl font-bold text-blue-900 mb-10 text-center">
					{t('featuredIndividuals')}
				</h2>
				<ResponsiveGate
					mobile={
						<div className="grid grid-cols-1 gap-3 max-w-6xl mx-auto">
							{produtos.map((p) => (
								<ProductCardMobile key={p.nome} {...p} to={`/${base}/${p.to}`} />
							))}
						</div>
					}
					desktop={
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
							{produtos.map((p) => (
								<ProductCard key={p.nome} {...p} to={`/${base}/${p.to}`} />
							))}
						</div>
					}
				/>
			</section>
			{/* Produtos para empresas */}
			<section className="py-16 px-6 bg-gray-50">
				<h2 className="text-3xl font-bold text-blue-900 mb-10 text-center">
					{t('featuredBusiness')}
				</h2>
				<ResponsiveGate
					mobile={
						<div className="grid grid-cols-1 gap-3 max-w-6xl mx-auto">
							{produtosEmp.map((p) => (
								<ProductCardMobile key={p.nome} {...p} to={`/${base}/${p.to}`} />
							))}
						</div>
					}
					desktop={
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
							{produtosEmp.map((p) => (
								<ProductCard key={p.nome} {...p} to={`/${base}/${p.to}`} />
							))}
						</div>
					}
				/>
			</section>
			{/* Benefícios */}
			<section className="py-16 px-6 bg-white">
				<div className="max-w-4xl mx-auto bg-blue-50 rounded-xl shadow-xl p-8">
					<h2 className="text-2xl font-bold text-blue-900 mb-4 text-center">
						{benefitsTitle}
					</h2>
					<ul className="space-y-3 text-blue-800 text-lg pl-0">
						{["🤝", "⚡", "🏢", "📦"].map((icon, idx) => (
							<li key={idx} className="flex items-center gap-3">
								<span className="text-2xl">{icon}</span>
								{t(`benefits.${idx}` as any)}
							</li>
						))}
					</ul>
				</div>
			</section>
		</div>
	);
}
