/**
 * Option Chain Greeks Calculator using Black-Scholes Approximation
 * Calculates Delta, Gamma, and implied variables for Call & Put Options
 */

// Cumulative standard normal distribution approximation
function stdNormalCDF(x) {
  const t = 1.0 / (1.0 + 0.2316419 * Math.abs(x));
  const d = 0.39894228 * Math.exp(-x * x / 2.0);
  const p = d * t * (0.31938153 + t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));
  return x >= 0 ? 1.0 - p : p;
}

// Probability density function of standard normal distribution
function stdNormalPDF(x) {
  return (1.0 / Math.sqrt(2.0 * Math.PI)) * Math.exp(-0.5 * x * x);
}

/**
 * Calculates option Greeks
 * @param {number} S Spot price
 * @param {number} K Strike price
 * @param {number} T Time to expiration in years (e.g. days_to_expiry / 365)
 * @param {number} r Risk-free interest rate (e.g., 0.07 for 7%)
 * @param {number} v Volatility (implied volatility, e.g. 0.15 for 15%)
 */
function calculateGreeks(S, K, T, r, v) {
  // If extremely close to expiry or invalid inputs, return defaults
  if (T <= 0 || v <= 0 || S <= 0 || K <= 0) {
    return {
      callDelta: S > K ? 1.0 : 0.0,
      putDelta: S < K ? -1.0 : 0.0,
      gamma: 0.0,
      callTheta: 0.0,
      putTheta: 0.0
    };
  }

  const d1 = (Math.log(S / K) + (r + (v * v) / 2.0) * T) / (v * Math.sqrt(T));
  const d2 = d1 - v * Math.sqrt(T);

  const callDelta = stdNormalCDF(d1);
  const putDelta = callDelta - 1.0;

  const pdfD1 = stdNormalPDF(d1);
  const gamma = pdfD1 / (S * v * Math.sqrt(T));

  // Approx theta (per day basis)
  const term1 = -(S * pdfD1 * v) / (2.0 * Math.sqrt(T));
  const term2_call = r * K * Math.exp(-r * T) * stdNormalCDF(d2);
  const term2_put = r * K * Math.exp(-r * T) * stdNormalCDF(-d2);
  
  const callTheta = (term1 - term2_call) / 365.0;
  const putTheta = (term1 + term2_put) / 365.0;

  return {
    callDelta: parseFloat(callDelta.toFixed(3)),
    putDelta: parseFloat(putDelta.toFixed(3)),
    gamma: parseFloat(gamma.toFixed(5)),
    callTheta: parseFloat(callTheta.toFixed(2)),
    putTheta: parseFloat(putTheta.toFixed(2))
  };
}

/**
 * Generates an Option Chain for a given spot price
 * @param {number} spotPrice Current spot price of the index
 * @param {number} strikeStep Difference between consecutive strikes (e.g., 50 for Nifty, 100 for Bank Nifty)
 * @param {number} vix India VIX value (used as base implied volatility)
 * @param {number} numStrikes Number of strikes to generate above & below ATM
 */
function generateOptionChain(spotPrice, strikeStep, vix, numStrikes = 10) {
  // Determine the At-The-Money (ATM) strike
  const atmStrike = Math.round(spotPrice / strikeStep) * strikeStep;
  const strikes = [];
  const ivBase = vix / 100.0; // India VIX base IV (e.g., 15% IV -> 0.15)
  const t = 4.0 / 365.0; // Assume 4 days to next weekly expiry
  const r = 0.07; // 7% risk-free rate

  for (let i = -numStrikes; i <= numStrikes; i++) {
    const strike = atmStrike + (i * strikeStep);
    
    // Add volatility skew (Smile effect: OTM options have slightly higher IV)
    const distanceFactor = Math.abs(strike - spotPrice) / spotPrice;
    const iv = ivBase + (distanceFactor * distanceFactor * 0.4); 

    // Theoretical pricing using simple intrinsic + extrinsic pricing
    const intrinsicCall = Math.max(0, spotPrice - strike);
    const intrinsicPut = Math.max(0, strike - spotPrice);
    
    // Extrinsic pricing based on Black-Scholes mock approximation
    const extrinsic = spotPrice * iv * Math.sqrt(t) * (1.0 - distanceFactor * 1.5);
    
    const callPrice = Math.max(1.0, parseFloat((intrinsicCall + extrinsic).toFixed(2)));
    const putPrice = Math.max(1.0, parseFloat((intrinsicPut + extrinsic).toFixed(2)));

    // Calculate Greeks
    const greeks = calculateGreeks(spotPrice, strike, t, r, iv);

    // Mock realistic Open Interest (OI) & Volume patterns
    // ATM/OTM options have higher volume and OI, extremely deep ITM have lower
    const oiBase = Math.floor(Math.exp(-Math.pow(strike - atmStrike, 2) / Math.pow(strikeStep * 4, 2)) * 1200000);
    const callOI = Math.max(5000, Math.floor(oiBase * (i < 0 ? 0.3 : 1.2) + Math.random() * 5000));
    const putOI = Math.max(5000, Math.floor(oiBase * (i > 0 ? 0.3 : 1.2) + Math.random() * 5000));
    
    // Random OI change (scaled)
    const callOIChange = Math.floor((Math.random() - 0.4) * (callOI * 0.1));
    const putOIChange = Math.floor((Math.random() - 0.4) * (putOI * 0.1));

    const callVolume = Math.floor(callOI * (0.8 + Math.random() * 0.6));
    const putVolume = Math.floor(putOI * (0.8 + Math.random() * 0.6));

    strikes.push({
      strike,
      call: {
        price: callPrice,
        change: parseFloat(((Math.random() - 0.5) * 5).toFixed(2)),
        volume: callVolume,
        oi: callOI,
        oiChange: callOIChange,
        iv: parseFloat((iv * 100).toFixed(2)),
        delta: greeks.callDelta,
        gamma: greeks.gamma,
        theta: greeks.callTheta,
        bid: parseFloat((callPrice * 0.99).toFixed(2)),
        ask: parseFloat((callPrice * 1.01).toFixed(2))
      },
      put: {
        price: putPrice,
        change: parseFloat(((Math.random() - 0.5) * 5).toFixed(2)),
        volume: putVolume,
        oi: putOI,
        oiChange: putOIChange,
        iv: parseFloat((iv * 100).toFixed(2)),
        delta: greeks.putDelta,
        gamma: greeks.gamma,
        theta: greeks.putTheta,
        bid: parseFloat((putPrice * 0.99).toFixed(2)),
        ask: parseFloat((putPrice * 1.01).toFixed(2))
      }
    });
  }

  // Calculate Put-Call Ratio (PCR)
  let totalCallOI = 0;
  let totalPutOI = 0;
  let highestCallOIStrike = strikes[0].strike;
  let maxCallOI = 0;
  let highestPutOIStrike = strikes[0].strike;
  let maxPutOI = 0;

  strikes.forEach(s => {
    totalCallOI += s.call.oi;
    totalPutOI += s.put.oi;

    if (s.call.oi > maxCallOI) {
      maxCallOI = s.call.oi;
      highestCallOIStrike = s.strike;
    }
    if (s.put.oi > maxPutOI) {
      maxPutOI = s.put.oi;
      highestPutOIStrike = s.strike;
    }
  });

  const pcr = parseFloat((totalPutOI / Math.max(1, totalCallOI)).toFixed(2));

  return {
    strikes,
    pcr,
    totalCallOI,
    totalPutOI,
    highestCallOIStrike,
    highestPutOIStrike,
    atmStrike
  };
}

module.exports = {
  calculateGreeks,
  generateOptionChain
};
