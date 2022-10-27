// NextBreadcrumbs.js

import { Breadcrumbs, Typography, Skeleton } from "@mui/material";
import NextLink from "next/link";
import styles from "./breadcrum.module.css";

const getUrlPaths = (paths) => {
  let pathsArray = ["/"];
  for (let i = 1; i < paths.length; i++) {
    if(paths[i]){ 
    pathsArray.push("/"+paths[i].replace(" ","-")?.toLowerCase());
    }
  }
  return pathsArray;
};
export default function NextBreadcrumbs({ paths, lastLoaded }) {
const urlPaths = getUrlPaths(paths);
  return (
    <Breadcrumbs aria-label="breadcrumb">
      {paths.map((path, i) => (
        <Crumb text={path} href={urlPaths[i]} key={i} last={i === paths.length - 1} lastLoaded={lastLoaded} />
      ))}
    </Breadcrumbs>
  );
}

function Crumb({ text, href, last = false, lastLoaded}) {
  if (last) {
    return (
      lastLoaded ?  <Typography className={styles.bread_text_last} color="text.primary">
        {text}
      </Typography> : <Skeleton variant="text" sx={{ fontSize: '1rem', width: '100px'}}  />
    );
  }

  return (
    <NextLink href={href}>
      <a className={styles.bread_text}>{text}</a>
    </NextLink>
  );
}
