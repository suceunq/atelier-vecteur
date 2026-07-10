use regex::Regex;
use std::sync::OnceLock;

const COORD_PRECISION: usize = 3;

fn comment_re() -> &'static Regex {
    static RE: OnceLock<Regex> = OnceLock::new();
    RE.get_or_init(|| Regex::new(r"(?s)<!--.*?-->").unwrap())
}

fn inter_tag_whitespace_re() -> &'static Regex {
    static RE: OnceLock<Regex> = OnceLock::new();
    RE.get_or_init(|| Regex::new(r">\s+<").unwrap())
}

fn number_re() -> &'static Regex {
    static RE: OnceLock<Regex> = OnceLock::new();
    RE.get_or_init(|| Regex::new(r"-?\d+\.\d+").unwrap())
}

fn round_number(raw: &str) -> String {
    let value: f64 = match raw.parse() {
        Ok(v) => v,
        Err(_) => return raw.to_string(),
    };
    let factor = 10f64.powi(COORD_PRECISION as i32);
    let rounded = (value * factor).round() / factor;

    let mut s = format!("{rounded}");
    if s.contains('.') {
        s = s.trim_end_matches('0').trim_end_matches('.').to_string();
    }
    if s.is_empty() || s == "-0" {
        s = "0".to_string();
    }
    s
}

/// Produces a clean, standards-compliant SVG string: strips editor comments,
/// collapses inter-tag whitespace, and rounds coordinate/length values to a
/// fixed precision so exported files stay compact and diff-friendly.
pub fn clean_svg(raw: &str) -> String {
    let no_comments = comment_re().replace_all(raw, "");
    let no_gaps = inter_tag_whitespace_re().replace_all(&no_comments, "><");
    let rounded = number_re().replace_all(&no_gaps, |caps: &regex::Captures| round_number(&caps[0]));
    rounded.trim().to_string()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn strips_comments() {
        let input = "<svg><!-- editor metadata --><rect x=\"1\" y=\"2\"/></svg>";
        let out = clean_svg(input);
        assert!(!out.contains("editor metadata"));
    }

    #[test]
    fn collapses_whitespace_between_tags() {
        let input = "<svg>\n  <rect x=\"1\" y=\"2\"/>\n</svg>";
        let out = clean_svg(input);
        assert!(!out.contains("\n"));
    }

    #[test]
    fn rounds_long_decimals() {
        let input = "<rect x=\"1.123456\" y=\"2.000001\"/>";
        let out = clean_svg(input);
        assert_eq!(out, "<rect x=\"1.123\" y=\"2\"/>");
    }

    #[test]
    fn leaves_integers_untouched() {
        let input = "<rect width=\"100\" height=\"50\"/>";
        let out = clean_svg(input);
        assert_eq!(out, input);
    }
}
