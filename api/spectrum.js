const allowedSpecies = /^[A-Z][a-z]? (I|II|III|IV|V|VI|VII|VIII|IX|X)$/;

module.exports = async function handler(request, response) {
  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    response.status(405).send("Method not allowed");
    return;
  }

  const species = request.query.species;
  if (typeof species !== "string" || !allowedSpecies.test(species)) {
    response.status(400).send("Invalid spectrum species");
    return;
  }

  const params = new URLSearchParams({
    spectra: species,
    output_type: "0",
    low_w: "380",
    upp_w: "700",
    unit: "1",
    de: "0",
    plot_out: "0",
    I_scale_type: "1",
    format: "0",
    line_out: "0",
    en_unit: "0",
    output: "0",
    bibrefs: "1",
    page_size: "15",
    show_obs_wl: "1",
    show_calc_wl: "1",
    unc_out: "1",
    order_out: "0",
    max_low_enrg: "",
    show_av: "2",
    max_upp_enrg: "",
    tsb_value: "0",
    min_str: "",
    A_out: "0",
    intens_out: "on",
    max_str: "",
    allowed_out: "1",
    forbid_out: "1",
    min_accur: "",
    min_intens: "",
    conf_out: "on",
    term_out: "on",
    enrg_out: "on",
    J_out: "on"
  });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const upstream = await fetch(`https://physics.nist.gov/cgi-bin/ASD/lines1.pl?${params}`, {
      headers: {"User-Agent": "Chemica/1.0 (NIST ASD spectrum viewer)"},
      redirect: "error",
      signal: controller.signal
    });

    if (!upstream.ok) {
      console.error(`NIST ASD returned HTTP ${upstream.status} for ${species}.`);
      response.status(502).send("NIST Atomic Spectra Database request failed");
      return;
    }

    response.setHeader("Content-Type", "text/html; charset=utf-8");
    response.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400");
    response.status(200).send(await upstream.text());
  } catch (error) {
    console.error(`Could not fetch ${species} spectrum from NIST ASD.`, error);
    response.status(502).send("NIST Atomic Spectra Database is unavailable");
  } finally {
    clearTimeout(timeout);
  }
};
