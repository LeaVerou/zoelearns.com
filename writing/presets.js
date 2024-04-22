const presets = {
	en: {
		upper: "A, B, C, D, E, F, G, H, I, J, K, L, M, N, O, P, Q, R, S, T, U, V, W, X, Y, Z",
		lower: "a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, r, s, t, u, v, w, x, y, z",
		punctuation: "., !, ?",
		numbers: "0, 1, 2, 3, 4, 5, 6, 7, 8, 9",
	},
	el: {
		upper: "Α, Β, Γ, Δ, Ε, Ζ, Η, Θ, Ι, Κ, Λ, Μ, Ν, Ξ, Ο, Π, Ρ, Σ, Τ, Υ, Φ, Χ, Ψ, Ω",
		lower: "α, β, γ, δ, ε, ζ, η, θ, ι, κ, λ, μ, ν, ξ, ο, π, ρ, σ, τ, υ, φ, χ, ψ, ω",
		punctuation: "., !, ;",
	},
	mk: {
		upper: "А, Б, В, Г, Д, Ѓ, Е, Ж, З, Ѕ, И, Ј, К, Л, Љ, М, Н, Њ, О, П, Р, С, Т, Ќ, У, Ф, Х, Ц, Ч, Џ, Ш",
		lower: "а, б, в, г, д, ѓ, е, ж, з, ѕ, и, ј, к, л, љ, м, н, њ, о, п, р, с, т, ќ, у, ф, х, ц, ч, џ, ш",
	},
	sr: {
		upper: "А, Б, В, Г, Д, Ђ, Е, Ж, З, И, Ј, К, Л, Љ, М, Н, Њ, О, П, Р, С, Т, Ћ, У, Ф, Х, Ц, Ч, Џ, Ш",
		lower: "а, б, в, г, д, ђ, е, ж, з, и, ј, к, л, љ, м, н, њ, о, п, р, с, т, ћ, у, ф, х, ц, ч, џ, ш",
	},
	sh: {
		upper: "A, B, C, Č, Ć, D, Dž, Đ, E, F, G, H, I, J, K, L, Lj, M, N, Nj, O, P, R, S, Š, T, U, V, Z, Ž",
		lower: "a, b, c, č, ć, d, dž, đ, e, f, g, h, i, j, k, l, lj, m, n, nj, o, p, r, s, š, t, u, v, z, ž",
	}
};

export function string_to_lines (str) {
	return str.trim().split(/\s*,\s*|\s*\r?\n\s*/).filter(Boolean);
}

for (let lang in presets) {
	for (let form in presets[lang]) {
		presets[lang][form] = new Set(string_to_lines(presets[lang][form]));
	}
}

export default presets;