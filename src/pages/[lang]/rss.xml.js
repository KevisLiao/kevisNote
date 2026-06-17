/*
 * Per-locale RSS feed: /<lang>/rss.xml
 */
import rss from '@astrojs/rss';
import { experimental_AstroContainer } from 'astro/container';
import { loadRenderers } from 'astro:container';
import { render } from 'astro:content';
import { getContainerRenderer as mdxContainerRenderer } from '@astrojs/mdx';
import sanitizeHtml from 'sanitize-html';
import slateConfig from '~@/slate.config';
import { getLocalizedPosts, i18nConfig } from '@/helpers/posts';

export async function getStaticPaths() {
  return i18nConfig.locales.map((lang) => ({ params: { lang } }));
}

export async function GET(context) {
  const locale = context.params.lang;
  const posts = await getLocalizedPosts(locale);
  const renderers = await loadRenderers([mdxContainerRenderer()]);
  const container = await experimental_AstroContainer.create({ renderers });

  const postItems = await Promise.all(
    posts.map(async (post) => {
      const { Content } = await render(post.entry);
      const htmlStr = await container.renderToString(Content);

      return {
        link: `/${locale}/blog/${post.slug}/`,
        title: post.entry.data.title,
        content: sanitizeHtml(htmlStr, {
          allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img']),
        }),
        ...post.entry.data,
      };
    }),
  );

  const rssOptions = {
    stylesheet: '/pretty-feed-v3.xsl',
    title: slateConfig.title,
    description: slateConfig.description,
    site: context.site,
    trailingSlash: false,
    items: postItems,
  };

  if (slateConfig.follow) {
    rssOptions.customData = `<follow_challenge>
      <feedId>${slateConfig.follow.feedId}</feedId>
      <userId>${slateConfig.follow.userId}</userId>
    </follow challenge>`;
  }

  return rss(rssOptions);
}
