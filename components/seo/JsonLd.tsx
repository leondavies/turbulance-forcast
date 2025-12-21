import { ReactElement } from "react";

type JsonLdProps = {
  data: Record<string, unknown> | Array<Record<string, unknown>>;
};

export function JsonLd({ data }: JsonLdProps): ReactElement {
  return (
    <script
      type="application/ld+json"
      // JSON.stringify is safe here; we control the content.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}


