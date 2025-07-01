import marked from "marked";
import { encodeHtml } from "../../utils/helpers"; // optional, if you still need it
import DOMPurify from "dompurify";

// Set marked config
marked.setOptions({
	gfm: true,
	breaks: true, // Enables line breaks with single newline
	smartLists: true, // Fixes weird list formatting
	smartypants: false, // Disables curly quotes, etc.
});

const customMarkdownRenderer = (text) => {
	if (!text) return "";

	// Decode HTML entities and fix newlines before markdown processing
	const decodedText = text
		?.replace(/&quot;/g, '"')
		?.replace(/&#039;/g, "'")
		?.replace(/&amp;/g, '&')
		?.replace(/&lt;/g, '<')
		?.replace(/&gt;/g, '>')
		?.replace(/\\n/g, '\n');  // Convert literal \n to actual newlines

	// Convert markdown to HTML
	const cleanedMarkdown = decodedText?.replace(/^\s{2,}/gm, "");
	let rawHtml = marked(cleanedMarkdown);
	rawHtml = rawHtml?.replace("<a", '<a target="_blank"');

	// Sanitize to prevent XSS
	const sanitizedHtml = DOMPurify.sanitize(rawHtml);

	return encodeHtml ? encodeHtml(sanitizedHtml) : sanitizedHtml;
};

export default customMarkdownRenderer;
