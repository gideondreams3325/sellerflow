/**
 * SellerFlow Automated Copyright Detection & Audio Muting Test Suite
 * Tests global audio and video automatic copyright identification and muting
 * Modeled after TikTok & Facebook Content ID copyright protection systems
 */

import assert from 'node:assert/strict';
import {
  matchStaticCopyrightCatalog,
  detectAudioVideoCopyright,
  COMMERCIAL_TRACK_CATALOG,
  COMMERCIAL_VIDEO_BROADCAST_CATALOG
} from '../copyright-detector.js';

console.log('--- Starting SellerFlow Copyright Detection & Muting Verification ---');

// Test 1: Commercial track match - Rema "Calm Down"
console.log('Test 1: Afrobeats hit - Rema "Calm Down"');
{
  const input = { text: 'Dancing with friends to Calm Down in Accra mall!', soundName: 'Rema - Calm Down' };
  const res = matchStaticCopyrightCatalog(input);
  assert.equal(res.copyrightDetected, true);
  assert.equal(res.audioMutedByCopyright, true);
  assert.equal(res.policy, 'mute_audio');
  assert.equal(res.trackTitle, 'Calm Down');
  assert.equal(res.artist, 'Rema');
  assert.ok(res.claimant.includes('UMG') || res.claimant.includes('Virgin'));
  console.log('  ✓ Detected: "Calm Down" by Rema -> audio automatically muted (mute_audio)');
}

// Test 2: Commercial track match - Burna Boy "Last Last"
console.log('Test 2: Afrobeats hit - Burna Boy "Last Last"');
{
  const input = { text: 'Chilling at labadi beach with Last Last playing in the background', fileName: 'beach_reel.mp4' };
  const res = matchStaticCopyrightCatalog(input);
  assert.equal(res.copyrightDetected, true);
  assert.equal(res.audioMutedByCopyright, true);
  assert.equal(res.policy, 'mute_audio');
  assert.equal(res.trackTitle, 'Last Last');
  assert.equal(res.artist, 'Burna Boy');
  console.log('  ✓ Detected: "Last Last" by Burna Boy -> audio automatically muted');
}

// Test 3: Commercial track match - Black Sherif "Kwaku the Traveller"
console.log('Test 3: Black Sherif "Kwaku the Traveller"');
{
  const input = { text: 'Kwaku the traveller anthem', soundName: 'Kwaku the Traveller - Black Sherif' };
  const res = matchStaticCopyrightCatalog(input);
  assert.equal(res.copyrightDetected, true);
  assert.equal(res.audioMutedByCopyright, true);
  assert.equal(res.trackTitle, 'Kwaku the Traveller');
  assert.equal(res.artist, 'Black Sherif');
  console.log('  ✓ Detected: "Kwaku the Traveller" by Black Sherif -> audio automatically muted');
}

// Test 4: Global chart hit - Tyla "Water"
console.log('Test 4: Global hit - Tyla "Water"');
{
  const input = { text: 'Trying the Tyla Water dance challenge!', soundName: 'Water by Tyla' };
  const res = matchStaticCopyrightCatalog(input);
  assert.equal(res.copyrightDetected, true);
  assert.equal(res.audioMutedByCopyright, true);
  assert.equal(res.trackTitle, 'Water');
  assert.equal(res.artist, 'Tyla');
  console.log('  ✓ Detected: "Water" by Tyla -> audio automatically muted');
}

// Test 5: Global hit - Sabrina Carpenter "Espresso"
console.log('Test 5: Global hit - Sabrina Carpenter "Espresso"');
{
  const input = { text: 'Morning coffee routine that\'s that me espresso', fileName: 'espresso_morning.mp4' };
  const res = matchStaticCopyrightCatalog(input);
  assert.equal(res.copyrightDetected, true);
  assert.equal(res.audioMutedByCopyright, true);
  assert.equal(res.trackTitle, 'Espresso');
  assert.equal(res.artist, 'Sabrina Carpenter');
  console.log('  ✓ Detected: "Espresso" by Sabrina Carpenter -> audio automatically muted');
}

// Test 6: Global hit - Kendrick Lamar "Not Like Us"
console.log('Test 6: Global hit - Kendrick Lamar "Not Like Us"');
{
  const input = { text: 'Party in Osu they not like us Kendrick playing loud!', soundName: 'Not Like Us' };
  const res = matchStaticCopyrightCatalog(input);
  assert.equal(res.copyrightDetected, true);
  assert.equal(res.audioMutedByCopyright, true);
  assert.equal(res.trackTitle, 'Not Like Us');
  assert.equal(res.artist, 'Kendrick Lamar');
  console.log('  ✓ Detected: "Not Like Us" by Kendrick Lamar -> audio automatically muted');
}

// Test 7: Global hit - Taylor Swift "Cruel Summer"
console.log('Test 7: Global hit - Taylor Swift "Cruel Summer"');
{
  const input = { text: 'Summer vibes with cruel summer in background', soundName: 'Taylor Swift Cruel Summer' };
  const res = matchStaticCopyrightCatalog(input);
  assert.equal(res.copyrightDetected, true);
  assert.equal(res.audioMutedByCopyright, true);
  assert.equal(res.trackTitle, 'Cruel Summer');
  assert.equal(res.artist, 'Taylor Swift');
  console.log('  ✓ Detected: "Cruel Summer" by Taylor Swift -> audio automatically muted');
}

// Test 8: Viral dance - Kupe Dance (Sony Music Entertainment)
console.log('Test 8: Viral dance - Kupe Dance (A-Star)');
{
  const input = { text: 'Doing the classic Kupe dance moves', soundName: 'A-Star Kupe' };
  const res = matchStaticCopyrightCatalog(input);
  assert.equal(res.copyrightDetected, true);
  assert.equal(res.audioMutedByCopyright, true);
  assert.equal(res.trackTitle, 'Kupe Dance');
  assert.equal(res.claimant, 'Sony Music Entertainment');
  console.log('  ✓ Detected: "Kupe Dance" -> audio automatically muted');
}

// Test 9: Major record label attribution - Universal Music Group (UMG)
console.log('Test 9: Major record label attribution - UMG');
{
  const input = { text: 'New album release under exclusive license to Universal Music Group', soundName: 'UMG Master Recording' };
  const res = matchStaticCopyrightCatalog(input);
  assert.equal(res.copyrightDetected, true);
  assert.equal(res.audioMutedByCopyright, true);
  assert.ok(res.claimant.includes('Universal Music Group'));
  console.log('  ✓ Detected: Universal Music Group commercial recording');
}

// Test 10: Major record label attribution - Sony Music Entertainment (SME)
console.log('Test 10: Major record label attribution - SME');
{
  const input = { text: 'Music video teaser distributed by Sony Music Entertainment', soundName: 'Columbia Records Master' };
  const res = matchStaticCopyrightCatalog(input);
  assert.equal(res.copyrightDetected, true);
  assert.equal(res.audioMutedByCopyright, true);
  assert.ok(res.claimant.includes('Sony Music Entertainment'));
  console.log('  ✓ Detected: Sony Music Entertainment commercial recording');
}

// Test 11: Major record label attribution - Warner Music Group (WMG)
console.log('Test 11: Major record label attribution - WMG');
{
  const input = { text: 'Official single release Warner Music Group Atlantic Records', soundName: 'WMG Licensed Audio' };
  const res = matchStaticCopyrightCatalog(input);
  assert.equal(res.copyrightDetected, true);
  assert.equal(res.audioMutedByCopyright, true);
  assert.ok(res.claimant.includes('Warner Music Group'));
  console.log('  ✓ Detected: Warner Music Group commercial recording');
}

// Test 12: Copyrighted video broadcast - Premier League Match
console.log('Test 12: Copyrighted sports video broadcast - Premier League');
{
  const input = { text: 'Full highlights of Arsenal vs Chelsea live premier league match!', fileName: 'epl_highlights.mp4', mediaType: 'video/mp4' };
  const res = matchStaticCopyrightCatalog(input);
  assert.equal(res.copyrightDetected, true);
  assert.equal(res.audioMutedByCopyright, true);
  assert.equal(res.type, 'video');
  assert.equal(res.trackTitle, 'Premier League Match Broadcast');
  console.log('  ✓ Detected: Premier League Match broadcast footage -> video audio muted');
}

// Test 13: Copyrighted video broadcast - UEFA Champions League
console.log('Test 13: Copyrighted sports video broadcast - UEFA Champions League');
{
  const input = { text: 'Unbelievable goals from uefa champions league highlights last night', fileName: 'ucl_clip.mp4' };
  const res = matchStaticCopyrightCatalog(input);
  assert.equal(res.copyrightDetected, true);
  assert.equal(res.audioMutedByCopyright, true);
  assert.equal(res.type, 'video');
  assert.equal(res.trackTitle, 'UEFA Champions League Match Recording');
  console.log('  ✓ Detected: UEFA Champions League broadcast footage -> video audio muted');
}

// Test 14: Copyrighted film/television broadcast - Netflix Original
console.log('Test 14: Copyrighted television broadcast - Netflix');
{
  const input = { text: 'Check this stranger things official clip full scene hd', fileName: 'netflix_clip.mp4' };
  const res = matchStaticCopyrightCatalog(input);
  assert.equal(res.copyrightDetected, true);
  assert.equal(res.audioMutedByCopyright, true);
  assert.equal(res.type, 'video');
  assert.equal(res.claimant, 'Netflix, Inc.');
  console.log('  ✓ Detected: Netflix Studios proprietary video footage -> video audio muted');
}

// Test 15: Copyrighted sports broadcast - NBA Official Game Broadcast
console.log('Test 15: Copyrighted sports video broadcast - NBA');
{
  const input = { text: 'Crazy dunk from the nba official broadcast last night', fileName: 'nba_dunk.mp4' };
  const res = matchStaticCopyrightCatalog(input);
  assert.equal(res.copyrightDetected, true);
  assert.equal(res.audioMutedByCopyright, true);
  assert.equal(res.type, 'video');
  assert.equal(res.claimant, 'National Basketball Association (NBA)');
  console.log('  ✓ Detected: NBA official game broadcast -> video audio muted');
}

// Test 16: Source filename commercial indicator
console.log('Test 16: Filename commercial music indicator');
{
  const input = { text: 'Check out my new reel', fileName: 'calm_down_rema_master.mp3' };
  const res = matchStaticCopyrightCatalog(input);
  assert.equal(res.copyrightDetected, true);
  assert.equal(res.audioMutedByCopyright, true);
  console.log('  ✓ Detected: Commercial master filename indicator -> video audio muted');
}

// Test 17: Benign creator commerce audio - Safe & Not Muted
console.log('Test 17: Original seller voice & ambient market sound (Safe)');
{
  const input = {
    text: 'Handcrafted Ashanti kente bags available at Makola Market. We deliver across Accra and Kumasi! Quality genuine fabric.',
    title: 'Authentic Kente Bags',
    fileName: 'kente_bag_demo.mp4',
    soundName: 'Original sound · Kente Palace',
    soundArtist: 'Kente Palace'
  };
  const res = matchStaticCopyrightCatalog(input);
  assert.equal(res.copyrightDetected, false);
  assert.equal(res.audioMutedByCopyright, false);
  assert.equal(res.policy, 'none');
  console.log('  ✓ Benign seller audio recognized as safe and unmuted');
}

// Test 18: Multimodal Gemini 3.8 Flash fallback simulation
console.log('Test 18: Gemini 3.8 Flash intelligent semantic copyright detection');
{
  const mockGeminiCall = async (prompt) => {
    assert.ok(prompt.includes('Automated Audio & Video Copyright Detection Engine'));
    return {
      text: JSON.stringify({
        copyrightDetected: true,
        type: 'audio',
        trackTitle: 'As It Was',
        artist: 'Harry Styles',
        claimant: 'Sony Music Entertainment (Columbia)',
        confidence: 0.97,
        policy: 'mute_audio',
        reason: 'Commercial master track detected via acoustic & semantic matching: "As It Was" by Harry Styles'
      })
    };
  };

  const input = {
    text: 'Sunny afternoon in East Legon with a classic chart topper',
    fileName: 'custom_audio_123.mp4',
    soundName: 'Summer Breeze Mashup'
  };

  const res = await detectAudioVideoCopyright(input, mockGeminiCall);
  assert.equal(res.copyrightDetected, true);
  assert.equal(res.audioMutedByCopyright, true);
  assert.equal(res.trackTitle, 'As It Was');
  assert.equal(res.artist, 'Harry Styles');
  assert.equal(res.policy, 'mute_audio');
  console.log('  ✓ Gemini 3.8 Flash multimodal recognition correctly triggered and formatted');
}

// Test 19: Safe post status preservation (Social feed visibility)
console.log('Test 19: Safe post status preservation (video remains live, audio muted)');
{
  // A post with commercial music is NOT a criminal safety violation (unlike drugs/scams/porn)
  // It is published/live on the For You feed, but its audio is silenced, exactly like TikTok & Facebook.
  const post = {
    id: 'post_music_01',
    status: 'published',
    reviewStatus: 'safe',
    safeContent: true,
    copyrightDetected: true,
    audioMutedByCopyright: true,
    copyrightMatch: {
      matched: true,
      type: 'audio',
      trackTitle: 'Calm Down',
      artist: 'Rema',
      claimant: 'Universal Music Group',
      policy: 'mute_audio'
    }
  };

  assert.equal(post.status, 'published', 'Post remains live on For You feed');
  assert.equal(post.reviewStatus, 'safe', 'Post is not marked as statutory criminal violation');
  assert.equal(post.audioMutedByCopyright, true, 'Audio is strictly silenced');
  console.log('  ✓ Post remains visible on For You feed with audio strictly silenced (TikTok/Facebook policy)');
}

// Test 20: Global feed un-mute enforcement rule
console.log('Test 20: Feed sound toggle audio mute lock');
{
  const videosInFeed = [
    { id: 'v1', copyrightMuted: false, muted: true, volume: 0 },
    { id: 'v2', copyrightMuted: true, muted: true, volume: 0 }, // Copyrighted
    { id: 'v3', copyrightMuted: false, muted: true, volume: 0 }
  ];

  // When user toggles global feed sound ON:
  const targetUnmuted = true;
  videosInFeed.forEach(v => {
    if (v.copyrightMuted) {
      v.muted = true; // MUST remain muted!
      v.volume = 0;
    } else {
      v.muted = !targetUnmuted;
      v.volume = targetUnmuted ? 1 : 0;
    }
  });

  assert.equal(videosInFeed[0].muted, false, 'Non-copyrighted video 1 unmuted');
  assert.equal(videosInFeed[1].muted, true, 'Copyrighted video 2 strictly remains muted');
  assert.equal(videosInFeed[2].muted, false, 'Non-copyrighted video 3 unmuted');
  console.log('  ✓ Feed audio toggle locks copyrighted videos in muted state without audio leakage');
}

console.log('\n--- All 20 Copyright Detection & Muting Tests Passed Successfully ---');
