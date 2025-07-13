
-- Create a function to populate content_genres based on TMDB data
CREATE OR REPLACE FUNCTION populate_content_genres()
RETURNS void AS $$
DECLARE
    content_record RECORD;
    genre_record RECORD;
    tmdb_genres INTEGER[];
    genre_id INTEGER;
BEGIN
    -- For each content item that has a TMDB ID
    FOR content_record IN 
        SELECT id, tmdb_id, content_type, title 
        FROM content 
        WHERE tmdb_id IS NOT NULL AND is_admin_approved = true
    LOOP
        -- Get genre IDs based on content type and common genre patterns
        tmdb_genres := ARRAY[]::INTEGER[];
        
        -- Action movies/series (common TMDB genre ID: 28)
        IF content_record.title ILIKE '%action%' OR content_record.title ILIKE '%war%' OR content_record.title ILIKE '%fight%' THEN
            tmdb_genres := tmdb_genres || 28;
        END IF;
        
        -- Comedy (TMDB genre ID: 35)
        IF content_record.title ILIKE '%comedy%' OR content_record.title ILIKE '%funny%' OR content_record.title ILIKE '%laugh%' THEN
            tmdb_genres := tmdb_genres || 35;
        END IF;
        
        -- Drama (TMDB genre ID: 18)
        IF content_record.title ILIKE '%drama%' OR content_record.title ILIKE '%life%' OR content_record.title ILIKE '%story%' THEN
            tmdb_genres := tmdb_genres || 18;
        END IF;
        
        -- Horror (TMDB genre ID: 27)
        IF content_record.title ILIKE '%horror%' OR content_record.title ILIKE '%scary%' OR content_record.title ILIKE '%dead%' THEN
            tmdb_genres := tmdb_genres || 27;
        END IF;
        
        -- Romance (TMDB genre ID: 10749)
        IF content_record.title ILIKE '%love%' OR content_record.title ILIKE '%romance%' OR content_record.title ILIKE '%heart%' THEN
            tmdb_genres := tmdb_genres || 10749;
        END IF;
        
        -- Science Fiction (TMDB genre ID: 878)
        IF content_record.title ILIKE '%space%' OR content_record.title ILIKE '%future%' OR content_record.title ILIKE '%sci%' THEN
            tmdb_genres := tmdb_genres || 878;
        END IF;
        
        -- Thriller (TMDB genre ID: 53)
        IF content_record.title ILIKE '%thriller%' OR content_record.title ILIKE '%mystery%' OR content_record.title ILIKE '%suspense%' THEN
            tmdb_genres := tmdb_genres || 53;
        END IF;
        
        -- Animation (TMDB genre ID: 16)
        IF content_record.title ILIKE '%animated%' OR content_record.title ILIKE '%cartoon%' OR content_record.title ILIKE '%anime%' THEN
            tmdb_genres := tmdb_genres || 16;
        END IF;
        
        -- Crime (TMDB genre ID: 80)
        IF content_record.title ILIKE '%crime%' OR content_record.title ILIKE '%police%' OR content_record.title ILIKE '%detective%' THEN
            tmdb_genres := tmdb_genres || 80;
        END IF;
        
        -- Fantasy (TMDB genre ID: 14)
        IF content_record.title ILIKE '%magic%' OR content_record.title ILIKE '%fantasy%' OR content_record.title ILIKE '%wizard%' THEN
            tmdb_genres := tmdb_genres || 14;
        END IF;
        
        -- If no specific genres found, assign default genres based on content type
        IF array_length(tmdb_genres, 1) IS NULL THEN
            IF content_record.content_type = 'movie' THEN
                tmdb_genres := ARRAY[18]; -- Drama as default for movies
            ELSE
                tmdb_genres := ARRAY[18]; -- Drama as default for series
            END IF;
        END IF;
        
        -- Insert genre relationships
        FOREACH genre_id IN ARRAY tmdb_genres
        LOOP
            -- Find the genre in our genres table
            SELECT id INTO genre_record.id 
            FROM genres 
            WHERE tmdb_id = genre_id;
            
            -- If genre found, create the relationship
            IF genre_record.id IS NOT NULL THEN
                INSERT INTO content_genres (content_id, genre_id)
                VALUES (content_record.id, genre_record.id)
                ON CONFLICT DO NOTHING;
                
                RAISE NOTICE 'Added genre % to content %', genre_id, content_record.title;
            END IF;
        END LOOP;
    END LOOP;
    
    RAISE NOTICE 'Content genres population completed';
END;
$$ LANGUAGE plpgsql;

-- Execute the function to populate the relationships
SELECT populate_content_genres();

-- Clean up the function
DROP FUNCTION populate_content_genres();

-- Add rating column to content table for better content organization
ALTER TABLE content ADD COLUMN IF NOT EXISTS rating NUMERIC(3,1);

-- Update some content with sample ratings (you can adjust these)
UPDATE content SET rating = 7.5 + (RANDOM() * 2.5) WHERE rating IS NULL AND is_admin_approved = true;
