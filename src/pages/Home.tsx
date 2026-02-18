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

	const benefitIcons = [
		<svg key="handshake" className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>,
		<svg key="bolt" className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /></svg>,
		<svg key="building" className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" /></svg>,
		<svg key="cube" className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" /></svg>,
	];

	return (
		<div className="min-h-screen bg-slate-50 flex flex-col relative">
			<Seo
				title={t('heroTitle')}
				image={`${import.meta.env.BASE_URL}logo-empresarial.svg`}
				canonicalPath={`/${base}`}
			/>
			{/* Hero responsivo */}
			<ResponsiveGate mobile={<HeroMobile />} desktop={<HeroDesktop />} />

			{/* Produtos em destaque — Particulares */}
			<section className="py-20 px-6 bg-gradient-to-b from-slate-50 to-white">
				<div className="max-w-6xl mx-auto">
					<div className="text-center mb-12">
						<span className="inline-block px-4 py-1.5 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold mb-3">
							{t('sectionTagIndividuals', { defaultValue: '👤 Particulares' })}
						</span>
						<h2 className="text-3xl md:text-4xl font-bold text-blue-900">
							{t('featuredIndividuals')}
						</h2>
					</div>
					<ResponsiveGate
						mobile={
							<div className="grid grid-cols-1 gap-3">
								{produtos.map((p) => (
									<ProductCardMobile key={p.nome} {...p} to={`/${base}/${p.to}`} />
								))}
							</div>
						}
						desktop={
							<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
								{produtos.map((p) => (
									<ProductCard key={p.nome} {...p} to={`/${base}/${p.to}`} />
								))}
							</div>
						}
					/>
				</div>
			</section>

			{/* Produtos para empresas */}
			<section className="py-20 px-6 bg-gradient-to-b from-white to-slate-50">
				<div className="max-w-6xl mx-auto">
					<div className="text-center mb-12">
						<span className="inline-block px-4 py-1.5 bg-indigo-100 text-indigo-700 rounded-full text-sm font-semibold mb-3">
							{t('sectionTagBusiness', { defaultValue: '🏢 Empresas' })}
						</span>
						<h2 className="text-3xl md:text-4xl font-bold text-blue-900">
							{t('featuredBusiness')}
						</h2>
					</div>
					<ResponsiveGate
						mobile={
							<div className="grid grid-cols-1 gap-3">
								{produtosEmp.map((p) => (
									<ProductCardMobile key={p.nome} {...p} to={`/${base}/${p.to}`} />
								))}
							</div>
						}
						desktop={
							<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
								{produtosEmp.map((p) => (
									<ProductCard key={p.nome} {...p} to={`/${base}/${p.to}`} />
								))}
							</div>
						}
					/>
				</div>
			</section>

			{/* Benefícios — Redesigned */}
			<section className="py-20 px-6 bg-gradient-to-br from-blue-50 via-white to-indigo-50">
				<div className="max-w-5xl mx-auto">
					<div className="text-center mb-12">
						<span className="inline-block px-4 py-1.5 bg-yellow-100 text-yellow-800 rounded-full text-sm font-semibold mb-3">
							{t('sectionTagBenefits', { defaultValue: '⭐ Vantagens' })}
						</span>
						<h2 className="text-3xl md:text-4xl font-bold text-blue-900">
							{benefitsTitle}
						</h2>
					</div>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
						{["🤝", "⚡", "🏢", "📦"].map((_icon, idx) => (
							<div key={idx} className="benefit-card bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex items-start gap-4">
								<div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md">
									{benefitIcons[idx]}
								</div>
								<div>
									<p className="text-blue-900 text-lg font-medium leading-relaxed">
										{t(`benefits.${idx}` as any)}
									</p>
								</div>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* CTA Banner */}
			<section className="py-16 px-6">
				<div className="max-w-4xl mx-auto relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 anim-hero-gradient p-12 text-center">
					{/* Decorative circles */}
					<div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-yellow-400/10 blur-2xl" />
					<div className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full bg-blue-400/10 blur-2xl" />
					<div className="relative z-10">
						<h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
							{t('ctaBannerTitle', { defaultValue: 'Pronto para proteger o que mais importa?' })}
						</h2>
						<p className="text-blue-200/90 mb-6 max-w-lg mx-auto">
							{t('ctaBannerDesc', { defaultValue: 'Faça a sua simulação em poucos minutos e receba uma proposta personalizada.' })}
						</p>
						<div className="flex flex-wrap items-center justify-center gap-4">
							<Link
								to={`/${base}/simulacao-auto`}
								className="px-8 py-4 bg-yellow-400 text-blue-900 font-bold rounded-full shadow-lg hover:shadow-yellow-400/25 hover:shadow-2xl transition-all duration-300 active:scale-[0.98]"
							>
								{t('heroCta1', { defaultValue: 'Simular agora' })}
							</Link>
							<Link
								to={`/${base}/contato`}
								className="px-8 py-4 text-white font-semibold rounded-full border-2 border-white/30 hover:bg-white/10 transition-all duration-300"
							>
								{t('ctaBannerContact', { defaultValue: 'Fale connosco' })}
							</Link>
						</div>
					</div>
				</div>
			</section>
		</div>
	);
}
