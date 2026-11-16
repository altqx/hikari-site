/** Where the Commons English track of Sprite Fright comes from (CC BY-SA 4.0). */
export const commonsTrackUrl =
  'https://commons.wikimedia.org/wiki/TimedText:Sprite_Fright_-_Blender_Open_Movie-full_movie.webm.en.srt';

/**
 * The one credit line a page carries for the footage in its pictures (decisions.md, Media;
 * owner Q485 and Q550): the film always, the Commons subtitles when a picture shows their
 * lines, and "Subtitles: Jibrill" for a Ray MV karaoke picture, naming it.
 */
export function PageCredits({ commons = false, jibrill }: { commons?: boolean; jibrill?: string }) {
  return (
    <p className="text-xs text-fd-muted-foreground" data-testid="page-credits">
      Sprite Fright, © Blender Foundation | studio.blender.org
      {commons && (
        <>
          {' '}
          · Subtitles:{' '}
          <a href={commonsTrackUrl} className="underline underline-offset-2 hover:text-fd-foreground">
            Wikimedia Commons TimedText contributors
          </a>
          , CC BY-SA 4.0
        </>
      )}
      {jibrill && <> · Subtitles: Jibrill ({jibrill})</>}
    </p>
  );
}
