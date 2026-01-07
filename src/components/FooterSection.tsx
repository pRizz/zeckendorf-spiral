import { Github, Linkedin, Twitter, BookOpen } from "lucide-react";
import { MEDIUM_ARTICLE_URL, LINKEDIN_URL, TWITTER_URL, GITHUB_URL, MEDIUM_URL } from "@/lib/constants";

export const FooterSection = (): JSX.Element => {
  return (
    <footer
      className="text-center mt-0 text-sm text-muted-foreground space-y-3"
      aria-label="Footer information"
    >
      <p>
        <a
          href="https://zeckendorf.lovable.app"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-primary transition-colors"
        >
          zeckendorf.lovable.app
        </a>
        {" · "}
        <a
          href="https://github.com/pRizz/zeckendorf-spiral"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-primary transition-colors"
        >
          Open Source
        </a>
      </p>
      <p className="text-xs">
        Made by{" "}
        <a 
          href={LINKEDIN_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-foreground hover:text-primary hover:underline transition-colors"
        >
          Peter Ryszkiewicz
        </a>{" "}
        with{" "}
        <a 
          href="https://cursor.sh" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          Cursor
        </a>
        {" "}and{" "}
        <a 
          href="https://lovable.dev" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          Lovable
        </a>
      </p>
      <div className="flex items-center justify-center gap-4 mt-2">
        <a
          href={GITHUB_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted-foreground hover:text-primary transition-colors"
          aria-label="GitHub"
        >
          <Github className="h-4 w-4" />
        </a>
        <a
          href={LINKEDIN_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted-foreground hover:text-primary transition-colors"
          aria-label="LinkedIn"
        >
          <Linkedin className="h-4 w-4" />
        </a>
        <a
          href={TWITTER_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted-foreground hover:text-primary transition-colors"
          aria-label="Twitter/X"
        >
          <Twitter className="h-4 w-4" />
        </a>
        <a
          href={MEDIUM_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted-foreground hover:text-primary transition-colors"
          aria-label="Medium"
        >
          <BookOpen className="h-4 w-4" />
        </a>
      </div>
    </footer>
  );
};

