/**
 * Parser for Daily Panchang & Rashifal Script
 * Formats incoming daily devotional bulletins into structured sections while preserving authentic formatting.
 */

export const DEFAULT_ASTRO_TEXT = '';

export function parseAstrologyScript(raw) {
  if (!raw || typeof raw !== 'string' || !raw.trim()) {
    return { raw: '', panchang: '', rashis: [] };
  }

  const signs = [
    { id: 1, name: 'मेष', symbol: '🐐', letters: 'चू, चे, चो, ला, ली, लू, ले, लो, अ' },
    { id: 2, name: 'वृष', symbol: '🐂', letters: 'ई, ऊ, ए, ओ, वा, वी, वू, वे, वो' },
    { id: 3, name: 'मिथुन', symbol: '👫', letters: 'का, की, कू, घ, ङ, छ, के, को, हा' },
    { id: 4, name: 'कर्क', symbol: '🦀', letters: 'ही, हू, हे, हो, डा, डी, डू, डे, डो' },
    { id: 5, name: 'सिंह', symbol: '🦁', letters: 'मा, मी, मू, मे, मो, टा, टी, टू, टे' },
    { id: 6, name: 'कन्या', symbol: '👩', letters: 'टो, पा, पी, पू, ष, ण, ठ, पे, पो' },
    { id: 7, name: 'तुला', symbol: '⚖️', letters: 'रा, री, रू, रे, रो, ता, ती, तू, ते' },
    { id: 8, name: 'वृश्चिक', symbol: '🦂', letters: 'तो, ना, नी, नू, ने, नो, या, यी, यू' },
    { id: 9, name: 'धनु', symbol: '🏹', letters: 'ये, यो, भा, भी, भू, ध, फा, ढा, भे' },
    { id: 10, name: 'मकर', symbol: '🐊', letters: 'भो, जा, जी, खी, खू, खा, खो, गा, गी' },
    { id: 11, name: 'कुंभ', symbol: '🍯', letters: 'गू, गे, गो, सा, सी, सू, से, सो, दा' },
    { id: 12, name: 'मीन', symbol: '🐳', letters: 'दी, दू, थ, झ, ञ, दे, दो, चा, ची' }
  ];

  const rashiIdx = raw.indexOf('आज का राशिफल');
  let panchangPart = raw;
  let rashiPart = '';

  if (rashiIdx !== -1) {
    panchangPart = raw.substring(0, rashiIdx).trim();
    rashiPart = raw.substring(rashiIdx).trim();
  }

  const parsedRashis = signs.map((sign, index) => {
    const searchName = sign.name;
    const startPos = rashiPart.indexOf(searchName);
    
    if (startPos === -1) {
      return { ...sign, text: '' };
    }

    const remaining = rashiPart.substring(startPos);
    const firstLineEnd = remaining.indexOf('\n');
    const headerLine = remaining.substring(0, firstLineEnd > 0 ? firstLineEnd : remaining.length);
    const contentAfterHeader = firstLineEnd > 0 ? remaining.substring(firstLineEnd + 1) : '';

    let nextPos = contentAfterHeader.length;
    for (let j = index + 1; j < signs.length; j++) {
      const np = contentAfterHeader.indexOf(signs[j].name);
      if (np !== -1 && np < nextPos) {
        nextPos = np;
        break;
      }
    }

    const footerMarkers = ['〰️〰️', '🙏राधे', '॥ शुभम् भवतु ॥'];
    for (const marker of footerMarkers) {
      const mp = contentAfterHeader.indexOf(marker);
      if (mp !== -1 && mp < nextPos) {
        nextPos = mp;
      }
    }

    const text = contentAfterHeader.substring(0, nextPos).trim();
    return {
      ...sign,
      header: headerLine.trim(),
      text: text
    };
  });

  return {
    raw: raw.trim(),
    panchang: panchangPart,
    rashis: parsedRashis
  };
}
