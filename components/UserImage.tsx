/* eslint-disable @next/next/no-img-element */
import React from "react";

interface UserImageProps {
  image: string | null | undefined;
}

export default function UserImage({ image }: UserImageProps) {
  return (
    <div>
      <img
        className="w-full h-full rounded-full cursor-pointer"
        src={image || ""}
        width={100}
        height={100}
        alt="user_profile_image"
        referrerPolicy="no-referrer"
      />
    </div>
  );
}