// src/app/(protected)/posts/create/components/PostDetails.tsx
"use client";

import { usePostEditorContext } from "@/context/PostEditorContext";
import { CompactCard } from "@/components/common";
import BusinessInfo from "./BusinessInfo";
import ItemInfo from "./ItemInfo";
import AdditionalPrompt from "./AdditionalPrompt";

export default function PostDetails() {
  const { captionGenerationSettings } = usePostEditorContext();
  const includeItemDescription =
    captionGenerationSettings.includeItemDescription;

  return (
    <CompactCard>
      <div className="space-y-1">
        <BusinessInfo />
        {includeItemDescription && <ItemInfo />}
        <AdditionalPrompt />
      </div>
    </CompactCard>
  );
}
