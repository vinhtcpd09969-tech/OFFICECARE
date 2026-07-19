const PROFANITY_WORDS = [
  'đm', 'dm', 'đéo', 'deo', 'lồn', 'lon', 'buồi', 'buoi', 'cặc', 'cac',
  'địt', 'dit', 'đụ', 'du', 'chó', 'cho', 'mẹ kiếp', 'me kiep', 'khốn nạn',
  'khon nan', 'đít', 'mẹ mày', 'me may', 'vkl', 'vcl', 'vl'
];

const VIETNAMESE_CHARS = 'a-zA-Z0-9_ÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠàáâãèéêìíòóôõùúăđĩũơƯĂÂÊÔƠƯưăâêôơư';

/**
 * Tự động ẩn các từ ngữ thô tục bằng dấu sao (ví dụ: "đéo" -> "***")
 * sử dụng ranh giới từ phù hợp với bảng chữ cái tiếng Việt Unicode.
 */
export function censorText(text: string | null | undefined): string {
  if (!text) return '';
  let censored = text;

  for (const word of PROFANITY_WORDS) {
    const escapedWord = word.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    // Khớp từ đứng độc lập (không bị dính vào từ khác trong tiếng Việt)
    const regex = new RegExp(`(^|[^${VIETNAMESE_CHARS}])(${escapedWord})($|[^${VIETNAMESE_CHARS}])`, 'gi');
    censored = censored.replace(regex, (_, prefix, targetWord, suffix) => {
      return prefix + '*'.repeat(targetWord.length) + suffix;
    });
  }

  return censored;
}

export default censorText;
